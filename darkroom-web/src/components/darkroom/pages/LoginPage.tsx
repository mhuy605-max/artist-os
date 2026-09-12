import type { FormEvent } from "react";
import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi, authQueryKey } from "@/services/api/auth";

import { Logo } from "../Logo";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const authMutation = useMutation({
    mutationFn: () => {
      if (mode === "register") {
        return authApi.register({
          email: email.trim(),
          password,
          displayName: displayName.trim() || null,
        });
      }

      return authApi.login({ email: email.trim(), password });
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKey, user);
      navigate({ to: "/dashboard" });
    },
    onError: (caught) => {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    authMutation.mutate();
  }

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1.2fr_0.8fr]">
      <section className="relative hidden overflow-hidden border-r border-border p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 hairline-grid" />
        <div className="relative w-48">
          <Logo />
        </div>
        <div className="relative max-w-2xl">
          <p className="label-tech">DARKROOM SYSTEM</p>
          <h1 className="mt-4 display-xl uppercase">Music workflow control room</h1>
          <p className="mt-5 text-sm text-muted-foreground">
            First-party DARKROOM SYSTEM authentication backed by the ASP.NET API.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 w-48 lg:hidden">
            <Logo />
          </div>
          <p className="label-tech">{mode === "register" ? "Create account" : "Sign in"}</p>
          <h2 className="mt-3 display-lg uppercase">DARKROOM SYSTEM</h2>
          <form className="mt-8 space-y-4" onSubmit={submit}>
            <div>
              <label className="label-tech" htmlFor="auth-email">
                Email
              </label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2"
                required
              />
            </div>
            {mode === "register" ? (
              <div>
                <label className="label-tech" htmlFor="auth-display-name">
                  Display name
                </label>
                <Input
                  id="auth-display-name"
                  autoComplete="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="mt-2"
                />
              </div>
            ) : null}
            <div>
              <label className="label-tech" htmlFor="auth-password">
                Password
              </label>
              <Input
                id="auth-password"
                type="password"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2"
                required
                minLength={8}
                maxLength={200}
              />
            </div>
            {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
            <Button className="w-full" disabled={authMutation.isPending}>
              {authMutation.isPending
                ? "Working"
                : mode === "register"
                  ? "Create account"
                  : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setError("");
                setMode(mode === "register" ? "login" : "register");
              }}
            >
              {mode === "register" ? "Use existing account" : "Create account"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
