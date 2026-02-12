"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<"signin" | "signup" | "magic" | "forgot">("signin");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        const supabase = createClient();

        try {
            if (mode === "forgot") {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${location.origin}/auth/callback`,
                });
                if (error) throw error;
                setMessage("Check your email for the password reset link!");
            } else if (mode === "magic") {
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: { emailRedirectTo: `${location.origin}/auth/callback` },
                });
                if (error) throw error;
                setMessage("Check your email for the login link!");
            } else if (mode === "signup") {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { emailRedirectTo: `${location.origin}/auth/callback` },
                });
                if (error) throw error;
                setMessage("Check your email to confirm your account!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 right-20 w-72 h-72 bg-blue-400 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400 rounded-full blur-3xl" />
                </div>
                <div className="relative flex flex-col justify-center px-12">
                    <Link href="/" className="flex items-center gap-3 mb-12">
                        <Building2 className="h-10 w-10 text-white" />
                        <span className="font-display text-2xl font-bold text-white">
                            UrbanEstate
                        </span>
                    </Link>
                    <h2 className="font-display text-4xl font-bold text-white mb-6">
                        Manage Your
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Property Portfolio
                        </span>
                    </h2>
                    <p className="text-white/70 text-lg max-w-md">
                        List properties, upload photos, manage availability, and connect
                        with tenants — all from one dashboard.
                    </p>
                </div>
            </div>

            {/* Right panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="lg:hidden flex items-center gap-2 mb-4">
                        <Building2 className="h-8 w-8 text-primary" />
                        <span className="font-display text-xl font-bold">UrbanEstate</span>
                    </div>

                    <div>
                        <h1 className="font-display text-3xl font-bold">
                            {mode === "signup"
                                ? "Create Account"
                                : mode === "forgot"
                                    ? "Reset Password"
                                    : "Welcome Back"}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {mode === "signup"
                                ? "Sign up as a property agent"
                                : mode === "magic"
                                    ? "Sign in with a magic link"
                                    : mode === "forgot"
                                        ? "Enter your email to receive a reset link"
                                        : "Sign in to your agent dashboard"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="agent@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {mode !== "magic" && mode !== "forgot" && (
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3">
                                {message}
                            </div>
                        )}

                        <Button type="submit" size="lg" className="w-full" disabled={loading}>
                            {loading ? (
                                "Loading..."
                            ) : mode === "forgot" ? (
                                <>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Reset Link
                                </>
                            ) : mode === "magic" ? (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Send Magic Link
                                </>
                            ) : mode === "signup" ? (
                                <>
                                    Create Account
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="space-y-3 text-center text-sm">
                        {mode === "signin" && (
                            <>
                                <button
                                    onClick={() => setMode("forgot")}
                                    className="text-primary hover:underline block mx-auto"
                                >
                                    Forgot password?
                                </button>
                                <button
                                    onClick={() => setMode("magic")}
                                    className="text-primary hover:underline block mx-auto"
                                >
                                    Sign in with Magic Link
                                </button>
                                <p className="text-muted-foreground">
                                    Don&apos;t have an account?{" "}
                                    <button
                                        onClick={() => setMode("signup")}
                                        className="text-primary hover:underline"
                                    >
                                        Sign up
                                    </button>
                                </p>
                            </>
                        )}
                        {mode === "signup" && (
                            <p className="text-muted-foreground">
                                Already have an account?{" "}
                                <button
                                    onClick={() => setMode("signin")}
                                    className="text-primary hover:underline"
                                >
                                    Sign in
                                </button>
                            </p>
                        )}
                        {mode === "magic" && (
                            <button
                                onClick={() => setMode("signin")}
                                className="text-primary hover:underline"
                            >
                                Back to password sign in
                            </button>
                        )}
                        {mode === "forgot" && (
                            <button
                                onClick={() => setMode("signin")}
                                className="text-primary hover:underline"
                            >
                                Back to sign in
                            </button>
                        )}
                    </div>

                    <div className="text-center">
                        <Link
                            href="/"
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
