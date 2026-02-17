import { useState, useEffect, useRef } from "react";
import { Loader2, Shield, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import iconGif from "@/assets/icon.gif";
import { toast } from "sonner";

// Falling blue dust/pores background
const FallingDustBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    interface Particle {
      x: number;
      y: number;
      vy: number;
      vx: number;
      size: number;
      opacity: number;
      blur: number;
    }

    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const createParticle = (startY?: number): Particle => ({
      x: Math.random() * canvas.width,
      y: startY ?? Math.random() * canvas.height,
      vy: Math.random() * 0.5 + 0.15,
      vx: (Math.random() - 0.5) * 0.15,
      size: Math.random() * 0.8 + 0.2,
      opacity: 1,
      blur: 0,
    });

    for (let i = 0; i < 60; i++) {
      particles.push(createParticle());
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        ctx.save();
        if (p.blur > 0) {
          ctx.filter = `blur(${p.blur}px)`;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
        ctx.restore();

        // Move down
        p.y += p.vy;
        p.x += p.vx;

        // Reset when off screen
        if (p.y > canvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
};

const Index = () => {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleValidate = async () => {
    if (!key.trim()) return;
    setStatus("loading");

    const { data: products, error } = await supabase
      .from("products")
      .select("name, download_url, seller_key");

    if (error || !products || products.length === 0) {
      setStatus("error");
      toast.error("Nenhum produto cadastrado.", { position: "bottom-right" });
      return;
    }

    for (const p of products) {
      try {
        const { data: result, error: fnError } = await supabase.functions.invoke("validate-key", {
          body: { sellerKey: p.seller_key, licenseKey: key.trim() },
        });

        if (!fnError && result?.success === true) {
          setStatus("success");
          toast.success("Key válida, o produto será baixado em instantes.", { position: "bottom-right" });
          triggerDownload(p.download_url, p.name);
          return;
        }
      } catch {
        // Continue to next product
      }
    }

    setStatus("error");
    toast.error("Key inválida ou não encontrada.", { position: "bottom-right" });
  };

  const triggerDownload = (url: string, fileName?: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "download";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      <FallingDustBackground />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full overflow-hidden border border-primary/20 bg-background/60 backdrop-blur-sm shadow-lg shadow-primary/10">
            <img src={iconGif} alt="Icon" className="h-20 w-20 object-cover rounded-full" />
          </div>

          {/* Title */}
          <h1 className="mb-8 text-center text-3xl font-bold text-foreground">
            Download Loader
          </h1>

          {/* Card */}
          <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl shadow-2xl shadow-primary/5">
            <input
              type="text"
              placeholder="Enter License Key"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                if (status !== "idle") setStatus("idle");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleValidate()}
              className="mb-4 w-full rounded-xl border border-border bg-background/80 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground placeholder:text-center outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30 font-mono tracking-wide text-center"
            />

            <button
              onClick={handleValidate}
              disabled={status === "loading" || !key.trim()}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary py-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {status === "loading" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              Download Loader
            </button>
          </div>

          {/* Footer */}
        </div>
      </main>
    </div>
  );
};

export default Index;
