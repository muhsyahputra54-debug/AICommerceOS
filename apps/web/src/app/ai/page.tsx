import DashboardLayout from "@/components/layout/DashboardLayout";
import { Bot, Sparkles } from "lucide-react";

export default function AIAssistantPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            AI Assistant
          </h1>

          <p className="mt-2 text-muted-foreground">
            Asisten AI untuk membantu mengelola dan menganalisis bisnis Anda.
          </p>
        </div>

        {/* AI Assistant Card */}
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          {/* Assistant Header */}
          <div className="flex items-center gap-4 border-b p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>

            <div>
              <h2 className="font-semibold">
                AI Commerce Assistant
              </h2>

              <p className="text-sm text-muted-foreground">
                Ready to assist your business.
              </p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              Your AI Business Assistant
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              AI Assistant akan membantu Anda menganalisis penjualan,
              memahami pelanggan, mengelola produk, dan menjalankan
              automation bisnis.
            </p>
          </div>

          {/* Input Placeholder */}
          <div className="border-t p-4">
            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              AI chat interface akan tersedia pada tahap berikutnya...
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}