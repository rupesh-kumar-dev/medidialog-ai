import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Logo } from "@/components/brand";
import { MedicalDisclaimer } from "@/components/disclaimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account | MediSage AI" },
      {
        name: "description",
        content:
          "Sign in to MediSage AI to save assessments, keep your health history and personalise your dashboard.",
      },
      { property: "og:title", content: "Sign in | MediSage AI" },
      { property: "og:description", content: "Access your MediSage AI health workspace." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Please enter a valid email address.").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters.").max(72);
const nameSchema = z.string().trim().min(1, "Please enter your name.").max(100);

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [sentReset, setSentReset] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) { toast.error(parsedEmail.error.issues[0]?.message); return; }
    if (!password) { toast.error("Please enter your password."); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsedEmail.data,
      password,
    });
    setBusy(false);
    if (error) { toast.error("We couldn't sign you in. Please check your details."); return; }
    toast.success("Welcome back to MediSage AI.");
    void navigate({ to: "/dashboard" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const parsedName = nameSchema.safeParse(fullName);
    const parsedEmail = emailSchema.safeParse(email);
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedName.success) { toast.error(parsedName.error.issues[0]?.message); return; }
    if (!parsedEmail.success) { toast.error(parsedEmail.error.issues[0]?.message); return; }
    if (!parsedPassword.success) { toast.error(parsedPassword.error.issues[0]?.message); return; }

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsedEmail.data,
      password: parsedPassword.data,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsedName.data },
      },
    });
    setBusy(false);
    if (error) { toast.error("We couldn't create your account. Please try again."); return; }
    if (!data.session) {
      toast.success("Account created. Please check your email to confirm your address.");
      return;
    }
    toast.success("Your MediSage AI account is ready.");
    void navigate({ to: "/dashboard" });
  }

  async function googleSignIn() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setBusy(false);
    if (result.error) { toast.error("Google sign-in didn't work. Please try again."); return; }
    if (result.redirected) { return; }
    void navigate({ to: "/dashboard" });
  }

  async function forgotPassword() {
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) { toast.error("Enter your email above first."); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) { toast.error("We couldn't send the reset email. Please try again."); return; }
    setSentReset(true);
    toast.success("If that email exists, a reset link is on the way.");
  }

  return (
    <div className="gradient-soft min-h-[80vh] px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Welcome to MediSage AI</CardTitle>
            <CardDescription>
              Save assessments, keep your history and personalise your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-4">
                <form className="space-y-4" onSubmit={signIn}>
                  <Field
                    id="signin-email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                  />
                  <Field
                    id="signin-password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                  />
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Please wait…" : "Sign in"}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full"
                    onClick={() => void forgotPassword()}
                  >
                    {sentReset ? "Reset email sent" : "Forgot password?"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-4">
                <form className="space-y-4" onSubmit={signUp}>
                  <Field id="signup-name" label="Full name" value={fullName} onChange={setFullName} />
                  <Field
                    id="signup-email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                  />
                  <Field
                    id="signup-password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                  />
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Please wait…" : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={() => void googleSignIn()} disabled={busy}>
              Continue with Google
            </Button>
            <Button
              variant="ghost"
              className="mt-2 w-full"
              onClick={() => void navigate({ to: "/assessment" })}
            >
              Continue as guest
            </Button>
          </CardContent>
        </Card>
        <MedicalDisclaimer compact />
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={type === "password" ? "current-password" : "on"}
        required
      />
    </div>
  );
}
