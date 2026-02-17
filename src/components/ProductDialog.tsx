import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Loader2, Save, Upload, File } from "lucide-react";

interface Product {
  id: string;
  name: string;
  seller_key: string;
  download_url: string;
  file_name: string | null;
  app_name: string | null;
}

interface ProductDialogProps {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
}

const ProductDialog = ({ product, onClose, onSave }: ProductDialogProps) => {
  const [name, setName] = useState(product?.name || "");
  const [sellerKey, setSellerKey] = useState(product?.seller_key || "");
  const [appName, setAppName] = useState(product?.app_name || "");
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentFileName = file?.name || product?.file_name;

  const handleFile = (f: globalThis.File) => {
    setFile(f);
    setError("");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sellerKey.trim()) {
      setError("Preencha nome e seller key.");
      return;
    }
    if (!file && !product) {
      setError("Selecione um arquivo.");
      return;
    }

    setLoading(true);
    setError("");

    let downloadUrl = product?.download_url || "";
    let fileName = product?.file_name || "";

    // Upload file if new one selected
    if (file) {
      const filePath = `${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("downloads")
        .upload(filePath, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        setError("Erro ao enviar arquivo: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("downloads")
        .getPublicUrl(filePath);

      downloadUrl = urlData.publicUrl;
      fileName = file.name;

      // Delete old file if editing
      if (product?.download_url) {
        const oldPath = product.download_url.split("/downloads/")[1];
        if (oldPath) {
          await supabase.storage.from("downloads").remove([oldPath]);
        }
      }
    }

    const payload = {
      name: name.trim(),
      seller_key: sellerKey.trim(),
      download_url: downloadUrl,
      file_name: fileName,
      app_name: appName.trim() || null,
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
            <label className="mb-1 block text-sm text-muted-foreground">App Name (KeyAuth)</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              placeholder="Nome da aplicação no KeyAuth (opcional)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Arquivo *</label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              {currentFileName ? (
                <div className="flex items-center gap-3">
                  <File className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{currentFileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {file ? "Novo arquivo selecionado" : "Arquivo atual"}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Arraste o arquivo aqui ou <span className="text-primary">clique para selecionar</span>
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
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
