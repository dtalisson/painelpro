import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Loader2, Save } from "lucide-react";

interface Product {
  id: string;
  name: string;
  seller_key: string;
  download_url: string;
  file_name: string | null;
}

interface ProductDialogProps {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
}

const ProductDialog = ({ product, onClose, onSave }: ProductDialogProps) => {
  const [name, setName] = useState(product?.name || "");
  const [sellerKey, setSellerKey] = useState(product?.seller_key || "");
  const [downloadUrl, setDownloadUrl] = useState(product?.download_url || "");
  const [fileName, setFileName] = useState(product?.file_name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sellerKey.trim() || !downloadUrl.trim()) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      name: name.trim(),
      seller_key: sellerKey.trim(),
      download_url: downloadUrl.trim(),
      file_name: fileName.trim() || null,
    };

    let result;
    if (product) {
      result = await supabase.from("products").update(payload).eq("id", product.id);
    } else {
      result = await supabase.from("products").insert(payload);
    }

    if (result.error) {
      setError(result.error.message.includes("unique") ? "Essa seller key já existe." : result.error.message);
      setLoading(false);
      return;
    }

    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-card-foreground">
            {product ? "Editar Aplicação" : "Nova Aplicação"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              placeholder="Nome da aplicação"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Seller Key *</label>
            <input
              type="text"
              value={sellerKey}
              onChange={(e) => setSellerKey(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              placeholder="Chave única do produto"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">URL de Download *</label>
            <input
              type="url"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              placeholder="https://exemplo.com/arquivo.zip"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Nome do Arquivo</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              placeholder="arquivo.zip (opcional)"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {product ? "Salvar Alterações" : "Cadastrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductDialog;
