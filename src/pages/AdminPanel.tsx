import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Pencil, Trash2, Download, LogOut, Loader2, Circle, Activity, Package,
} from "lucide-react";
import ProductDialog from "@/components/ProductDialog";
import AppStatusTab from "@/components/AppStatusTab";
import FallingDustBackground from "@/components/FallingDustBackground";

type ProductStatus = "online" | "offline" | "maintenance";

interface Product {
  id: string;
  name: string;
  seller_key: string;
  download_url: string;
  file_name: string | null;
  app_name: string | null;
  status: ProductStatus;
  created_at: string;
}

const statusConfig: Record<ProductStatus, { label: string; color: string; bg: string }> = {
  online: { label: "Online", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
  offline: { label: "Offline", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" },
  maintenance: { label: "Manutenção", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30" },
};

const StatusSelector = ({
  status,
  onChange,
}: {
  status: ProductStatus;
  onChange: (s: ProductStatus) => void;
}) => {
  const [open, setOpen] = useState(false);
  const cfg = statusConfig[status];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${cfg.bg}`}
      >
        <Circle className={`h-2 w-2 fill-current ${cfg.color}`} />
        <span className={cfg.color}>{cfg.label}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-36 rounded-lg border border-border bg-card p-1 shadow-xl">
          {(Object.keys(statusConfig) as ProductStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors hover:bg-accent ${
                s === status ? "bg-accent" : ""
              }`}
            >
              <Circle className={`h-2 w-2 fill-current ${statusConfig[s].color}`} />
              <span className={statusConfig[s].color}>{statusConfig[s].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

type Tab = "products" | "app-status";

const AdminPanel = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin/login", { replace: true });
      return;
    }
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      await supabase.auth.signOut();
      navigate("/admin/login", { replace: true });
      return;
    }
    setAuthorized(true);
    fetchProducts();
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const handleStatusChange = async (id: string, status: ProductStatus) => {
    await supabase.from("products").update({ status }).eq("id", id);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  };

  const handleSave = () => {
    setDialogOpen(false);
    setEditProduct(null);
    fetchProducts();
  };

  if (!authorized) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden">
        <FallingDustBackground />
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground relative z-10" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "products", label: "Aplicações", icon: <Package className="h-4 w-4" /> },
    { id: "app-status", label: "App Status", icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <FallingDustBackground />
      {/* Header */}
      <header className="relative z-10 border-b border-border/40 px-6 py-6 backdrop-blur-xl bg-card/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie aplicações e arquivos de download
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              Ir pro Download
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 backdrop-blur-xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-6">
        <div className="flex gap-1 rounded-xl border border-border/40 bg-card/30 p-1 backdrop-blur-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-6">
        {activeTab === "products" && (
          <>
            <div className="rounded-2xl border border-border/40 bg-card/40 p-6 backdrop-blur-2xl shadow-[0_8px_60px_-12px_rgba(59,130,246,0.12)]">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-card-foreground">Aplicações</h2>
                  <p className="text-sm text-muted-foreground">
                    Cadastre suas aplicações e gerencie as seller keys
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditProduct(null);
                    setDialogOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Nova Aplicação
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : products.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">
                  Nenhuma aplicação cadastrada.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Nome</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Seller Key</th>
                        <th className="pb-3 font-medium">Cadastrado em</th>
                        <th className="pb-3 text-right font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-border last:border-0">
                          <td className="py-4">
                            <div>
                              <span className="font-medium text-card-foreground">{p.name}</span>
                              {p.file_name && (
                                <p className="text-xs text-muted-foreground">{p.file_name}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-4">
                            <StatusSelector
                              status={p.status}
                              onChange={(s) => handleStatusChange(p.id, s)}
                            />
                          </td>
                          <td className="py-4">
                            <code className="rounded bg-accent px-2 py-1 text-xs text-muted-foreground">
                              {p.seller_key.substring(0, 20)}...
                            </code>
                          </td>
                          <td className="py-4 text-sm text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditProduct(p);
                                  setDialogOpen(true);
                                }}
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {dialogOpen && (
              <ProductDialog
                product={editProduct}
                onClose={() => {
                  setDialogOpen(false);
                  setEditProduct(null);
                }}
                onSave={handleSave}
              />
            )}
          </>
        )}

        {activeTab === "app-status" && <AppStatusTab />}
      </main>
    </div>
  );
};

export default AdminPanel;
