import { NextResponse } from "next/server";

import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type GenerateRequest = {
  tone?: string;
  language?: string;
  targetAudience?: string;
  instructions?: string;
};

type GeneratedContent = {
  description: string;
  short_description: string;
  seo_title: string;
  meta_description: string;
  keywords: string[];
};

type OpenAIResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unknown description generation error";
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY belum dikonfigurasi pada server.",
      },
      { status: 503 },
    );
  }

  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return NextResponse.json(
      {
        error: "Organization aktif tidak ditemukan.",
      },
      { status: 401 },
    );
  }

  const organizationId =
    currentOrganization.organizationId;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        error: "Authentication required.",
      },
      { status: 401 },
    );
  }

  const body =
    (await request.json().catch(() => ({}))) as GenerateRequest;

  const tone =
    String(body.tone ?? "professional").trim() ||
    "professional";

  const language =
    String(body.language ?? "Indonesian").trim() ||
    "Indonesian";

  const targetAudience =
    String(body.targetAudience ?? "").trim();

  const instructions =
    String(body.instructions ?? "").trim();

  if (tone.length > 100) {
    return NextResponse.json(
      { error: "Tone terlalu panjang." },
      { status: 400 },
    );
  }

  if (language.length > 100) {
    return NextResponse.json(
      { error: "Language terlalu panjang." },
      { status: 400 },
    );
  }

  if (targetAudience.length > 1000) {
    return NextResponse.json(
      { error: "Target audience terlalu panjang." },
      { status: 400 },
    );
  }

  if (instructions.length > 4000) {
    return NextResponse.json(
      { error: "Instructions terlalu panjang." },
      { status: 400 },
    );
  }

  const { id } = await params;

  const { data: product, error: productError } =
    await supabase
      .from("products")
      .select(
        "id, name, sku, description, price, cost_price, stock, status, category_id, metadata",
      )
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

  if (productError) {
    return NextResponse.json(
      { error: productError.message },
      { status: 500 },
    );
  }

  if (!product) {
    return NextResponse.json(
      { error: "Product tidak ditemukan." },
      { status: 404 },
    );
  }

  const { data: variants, error: variantsError } =
    await supabase
      .from("product_variants")
      .select(
        "id, name, sku, price, cost_price, stock, status, attributes",
      )
      .eq("organization_id", organizationId)
      .eq("product_id", product.id)
      .order("name", { ascending: true });

  if (variantsError) {
    return NextResponse.json(
      { error: variantsError.message },
      { status: 500 },
    );
  }

  const model =
    process.env.OPENAI_DESCRIPTION_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-5.6-luna";

  const inputSnapshot = {
    product,
    variants: variants ?? [],
    generation_preferences: {
      tone,
      language,
      target_audience: targetAudience || null,
      instructions: instructions || null,
    },
  };

  const {
    data: generation,
    error: generationError,
  } = await supabase
    .from("product_description_generations")
    .insert({
      organization_id: organizationId,
      product_id: product.id,
      provider: "openai",
      model,
      status: "running",
      tone,
      language,
      target_audience: targetAudience || null,
      instructions: instructions || null,
      input_snapshot: inputSnapshot,
      created_by: user.id,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (generationError || !generation) {
    return NextResponse.json(
      {
        error:
          generationError?.message ??
          "Description generation tidak dapat dibuat.",
      },
      { status: 500 },
    );
  }

  try {
    const aiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },

        cache: "no-store",

        body: JSON.stringify({
          model,

          messages: [
            {
              role: "system",
              content: [
                "You are an ecommerce product copywriter.",
                "Use only facts supplied in the product data.",
                "Never invent specifications, certifications, discounts, guarantees, scarcity, or external market facts.",
                "Write commercially useful but factual copy.",
                "Avoid unsupported superlatives.",
                "Return all content in the requested language.",
              ].join("\n"),
            },

            {
              role: "user",
              content: JSON.stringify(inputSnapshot),
            },
          ],

          response_format: {
            type: "json_schema",

            json_schema: {
              name: "product_description_generation",
              strict: true,

              schema: {
                type: "object",
                additionalProperties: false,

                properties: {
                  description: {
                    type: "string",
                  },

                  short_description: {
                    type: "string",
                  },

                  seo_title: {
                    type: "string",
                  },

                  meta_description: {
                    type: "string",
                  },

                  keywords: {
                    type: "array",

                    items: {
                      type: "string",
                    },
                  },
                },

                required: [
                  "description",
                  "short_description",
                  "seo_title",
                  "meta_description",
                  "keywords",
                ],
              },
            },
          },
        }),
      },
    );

    const responseData =
      (await aiResponse.json()) as OpenAIResponse;

    if (!aiResponse.ok) {
      throw new Error(
        responseData.error?.message ??
          `OpenAI request failed (${aiResponse.status})`,
      );
    }

    const content =
      responseData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(
        "OpenAI returned no generated content.",
      );
    }

    const generated =
      JSON.parse(content) as GeneratedContent;

    if (!generated.description?.trim()) {
      throw new Error(
        "Generated product description is empty.",
      );
    }

    const { error: updateError } =
      await supabase
        .from("product_description_generations")
        .update({
          status: "completed",

          generated_description:
            generated.description,

          short_description:
            generated.short_description,

          seo_title:
            generated.seo_title,

          meta_description:
            generated.meta_description,

          keywords:
            generated.keywords,

          error_message: null,

          completed_at:
            new Date().toISOString(),
        })
        .eq("id", generation.id)
        .eq("organization_id", organizationId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      generationId: generation.id,
      status: "completed",
    });
  } catch (error) {
    const message = getErrorMessage(error);

    await supabase
      .from("product_description_generations")
      .update({
        status: "failed",
        error_message: message.slice(0, 4000),
        completed_at: new Date().toISOString(),
      })
      .eq("id", generation.id)
      .eq("organization_id", organizationId);

    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}
