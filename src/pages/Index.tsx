import { useState, useEffect, useRef } from "react";
import { CheckCircle, Loader2, Shield, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Geometric shape animation on canvas
const GeometricBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - dist / 200)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${p.opacity})`;
        ctx.fill();

        // Move
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }

      // Draw big geometric shapes
      drawShape(ctx, canvas.width * 0.15, canvas.height * 0.4, 180, Date.now() * 0.0003);
      drawShape(ctx, canvas.width * 0.85, canvas.height * 0.35, 200, Date.now() * 0.0002 + 1);
      drawShape(ctx, canvas.width * 0.75, canvas.height * 0.8, 120, Date.now() * 0.0004 + 2);

      animationId = requestAnimationFrame(draw);
    };

    const drawShape = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      size: number,
      angle: number
    ) => {
      const points = [];
      const sides = 5;
      for (let i = 0; i < sides; i++) {
        const a = angle + (Math.PI * 2 * i) / sides;
        const r = size * (0.7 + 0.3 * Math.sin(a * 2 + Date.now() * 0.001));
        points.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
      }

      // Fill
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(59, 130, 246, 0.06)";
      ctx.fill();

      // Edges
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Connect to center
      for (const p of points) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = "rgba(59, 130, 246, 0.15)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Vertices
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(59, 130, 246, 0.6)";
        ctx.fill();
      }
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
      <GeometricBackground />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 backdrop-blur-sm">
            <Shield className="h-8 w-8 text-primary" />
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
              className="mb-4 w-full rounded-xl border border-border bg-background/80 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30 font-mono tracking-wide"
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
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <Shield className="h-3.5 w-3.5" />
            Secured by KeyAuth
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
