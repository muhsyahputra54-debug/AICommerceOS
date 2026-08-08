"use client";

import { useEffect, useState } from "react";
import { LogOut, UserCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type UserProfileData = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

export default function UserProfile() {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const metadata = user.user_metadata;

        setUser({
          name:
            metadata?.full_name ||
            metadata?.name ||
            "User",
          email: user.email || "",
          avatarUrl:
            metadata?.avatar_url ||
            metadata?.picture ||
            null,
        });
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();

    await supabase.auth.signOut();

    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <UserCircle2 className="h-9 w-9 text-gray-400" />

        <div>
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          <div className="mt-1 h-3 w-28 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="h-9 w-9 rounded-full object-cover"
        />
      ) : (
        <UserCircle2 className="h-9 w-9 text-gray-500" />
      )}

      <div className="hidden sm:block">
        <p className="text-sm font-semibold">
          {user.name}
        </p>

        <p className="text-xs text-gray-500">
          {user.email}
        </p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        title="Logout"
        aria-label="Logout"
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );
}