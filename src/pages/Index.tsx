import { useState } from "react";
import { Shield, Download, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [product, setProduct] = useState<{ name: string; download_url: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleValidate = async () => {
    if (!key.trim()) return;
    setStatus("loading");
    setProduct(null);
    setErrorMsg("");

    // Get all products and try to validate the license key against each seller key
    const { data: products, error } = await supabase
      .from("products")
      .select("name, download_url, seller_key");

    if (error || !products || products.length === 0) {
      setStatus("error");
      setErrorMsg("Nenhum produto cadastrado.");
      return;
    }

    // Try each product's seller key against the KeyAuth API
    for (const p of products) {
      try {
        const { data: result, error: fnError } = await supabase.functions.invoke("validate-key", {
          body: { sellerKey: p.seller_key, licenseKey: key.trim() },
        });

        if (!fnError && result?.success === true) {
          setProduct({ name: p.name, download_url: p.download_url });
          setStatus("success");
          triggerDownload(p.download_url, p.name);
          return;
        }
      } catch {
        // Continue to next product
      }
    }

    setStatus("error");
    setErrorMsg("Key inválida ou não encontrada.");
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-success" />
          <span className="text-lg font-semibold text-foreground">Painel</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Shield className="h-4 w-4" />
            Admin
          </a>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl text-center">
          <h1 className="mb-3 text-4xl font-bold text-foreground">Painel de Download</h1>
          <p className="mb-10 text-muted-foreground">Simples, direto e pronto para você plugar seus links.</p>

          <div className="rounded-xl border border-border bg-card p-8">
            <div className="mb-2 flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-card-foreground">Download</h2>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">Cole sua key para validar</p>

            <div className="mb-4 flex overflow-hidden rounded-lg border border-border bg-background">
              <span className="flex items-center px-4 text-sm text-muted-foreground border-r border-border">Key</span>
              <input
                type="text"
                placeholder="Cole sua key aqui"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  if (status !== "idle") setStatus("idle");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleValidate()}
                className="flex-1 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>

            {status === "error" && (
              <div className="mb-4 flex items-center justify-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                {errorMsg}
              </div>
            )}

            {status === "success" && product && (
              <div className="mb-4 rounded-lg border border-success/30 bg-success/10 p-4">
                <p className="mb-3 text-sm text-success">
                  ✓ Key válida! Produto: <strong>{product.name}</strong>
                </p>
                <button
                  onClick={() => triggerDownload(product.download_url, product.name)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-success py-3 text-sm font-medium text-success-foreground transition-opacity hover:opacity-90"
                >
                  <Download className="h-4 w-4" />
                  Baixar {product.name}
                </button>
              </div>
            )}

            {status !== "success" && (
              <button
                onClick={handleValidate}
                disabled={status === "loading" || !key.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Validar Key
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
