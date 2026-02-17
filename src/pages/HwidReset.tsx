import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import iconGif from "@/assets/icon.gif";
import FallingDustBackground from "@/components/FallingDustBackground";
import PageNavigation from "@/components/PageNavigation";

const HwidReset = () => {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleReset = async () => {
    if (!key.trim()) return;
    setStatus("loading");

    const { data: products, error } = await supabase
      .from("products")
      .select("name, seller_key");

    if (error || !products || products.length === 0) {
      setStatus("error");
      toast.error("Nenhum produto cadastrado.", { position: "bottom-right" });
      return;
    }

    for (const p of products) {
      try {
        const { data: result, error: fnError } = await supabase.functions.invoke("reset-hwid", {
          body: { sellerKey: p.seller_key, licenseKey: key.trim(), softwareName: p.name },
        });

        if (!fnError && result?.success === true) {
          setStatus("success");
          toast.success("HWID resetado com sucesso!", { position: "bottom-right" });
          return;
        }
      } catch {
        // Continue to next product
      }
    }

    setStatus("error");
    toast.error("Key inválida, não encontrada ou não foi usada.", { position: "bottom-right" });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      <FallingDustBackground />
      <PageNavigation />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full overflow-hidden border border-primary/20 bg-background/60 backdrop-blur-sm shadow-lg shadow-primary/10">
            <img src={iconGif} alt="Icon" className="h-20 w-20 object-cover rounded-full" />
          </div>

          <h1 className="mb-8 text-center text-3xl font-bold text-foreground">
            HWID Reset
          </h1>

          <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl shadow-2xl shadow-primary/5">
            <input
              type="text"
              placeholder="Enter License Key"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                if (status !== "idle") setStatus("idle");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
              className="mb-4 w-full rounded-xl border border-border bg-background/80 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground placeholder:text-center outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30 font-mono tracking-wide text-center"
            />

            <button
              onClick={handleReset}
              disabled={status === "loading" || !key.trim()}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary py-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {status === "loading" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RotateCcw className="h-5 w-5" />
              )}
              Reset HWID
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HwidReset;
