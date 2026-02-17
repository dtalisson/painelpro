import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LogIn, Shield } from "lucide-react";
import FallingDustBackground from "@/components/FallingDustBackground";
import iconGif from "@/assets/icon.gif";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Credenciais inválidas.");
      setLoading(false);
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      setError("Você não tem permissão de administrador.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    navigate("/admin");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 overflow-hidden">
      <FallingDustBackground />

      <div className="relative z-10 w-full max-w-sm">
        {/* Icon */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full overflow-hidden border border-primary/30 bg-background/60 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.15)]">
          <img src={iconGif} alt="Icon" className="h-20 w-20 object-cover rounded-full" />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-2xl shadow-[0_8px_60px_-12px_rgba(59,130,246,0.12)] p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Admin Login</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Acesso restrito a administradores
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background/70"
                placeholder="admin@email.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background/70"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Entrar
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5">
            <div className="h-1 w-1 rounded-full bg-primary/40" />
            <div className="h-1 w-1 rounded-full bg-primary/20" />
            <div className="h-1 w-1 rounded-full bg-primary/10" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
