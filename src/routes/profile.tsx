import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { BrandLoader } from "@/components/brand";
import { MedicalDisclaimer } from "@/components/disclaimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile | MediSage AI" },
      {
        name: "description",
        content: "Update your name and account details for a more personalised MediSage AI.",
      },
      { property: "og:title", content: "Profile | MediSage AI" },
      { property: "og:description", content: "Manage your MediSage AI account." },
    ],
  }),
  component: ProfilePage,
});

const nameSchema = z.string().trim().min(1, "Please enter your name.").max(100);

function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
  }, [profile?.full_name]);

  if (loading || !user) return <BrandLoader label="Loading your profile…" />;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = nameSchema.safeParse(name);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message);
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: parsed.data })
      .eq("id", user!.id);
    setBusy(false);
    if (error) {
      toast.error("We couldn't save your profile.");
      return;
    }
    await refreshProfile();
    toast.success("Profile updated.");
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Your profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={save}>
            <div className="space-y-1.5">
              <Label htmlFor="full-name">Full name</Label>
              <Input id="full-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email ?? ""} readOnly disabled />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <MedicalDisclaimer compact />
    </div>
  );
}
