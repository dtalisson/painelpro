import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Pencil, Trash2, Loader2, Circle, X, Save,
} from "lucide-react";

interface AppStatus {
  id: string;
  app_id: string;
  status: string;
  current_version: string;
  min_version: string;
  maintenance: boolean;
  message: string | null;
  message_online: string | null;
  message_offline: string | null;
  message_update_required: string | null;
  message_maintenance: string | null;
  download_url: string | null;
  created_at: string;
}

const defaultForm: Omit<AppStatus, "id" | "created_at"> = {
  app_id: "",
  status: "online",
  current_version: "1.0",
  min_version: "1.0",
  maintenance: false,
  message: "",
  message_online: "",
  message_offline: "",
  message_update_required: "",
  message_maintenance: "",
  download_url: "",
};

const statusColors: Record<string, { dot: string; bg: string }> = {
  online: { dot: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
  offline: { dot: "text-red-400", bg: "bg-red-400/10 border-red-400/30" },
};

const AppStatusTab = () => {
  const [apps, setApps] = useState<AppStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editApp, setEditApp] = useState<AppStatus | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    const { data } = await supabase
      .from("app_status")
      .select("*")
      .order("created_at", { ascending: false });
    setApps((data as AppStatus[]) || []);
    setLoading(false);
  };

  const openDialog = (app?: AppStatus) => {
    if (app) {
      setEditApp(app);
      setForm({
        app_id: app.app_id,
        status: app.status,
        current_version: app.current_version,
        min_version: app.min_version,
        maintenance: app.maintenance,
        message: app.message || "",
        message_online: app.message_online || "",
        message_offline: app.message_offline || "",
        message_update_required: app.message_update_required || "",
        message_maintenance: app.message_maintenance || "",
        download_url: app.download_url || "",
      });
    } else {
      setEditApp(null);
      setForm({ ...defaultForm });
    }
    setError("");
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.app_id.trim()) {
      setError("App ID é obrigatório.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      app_id: form.app_id.trim(),
      status: form.status,
      current_version: form.current_version.trim(),
      min_version: form.min_version.trim(),
      maintenance: form.maintenance,
      message: form.message?.trim() || null,
      message_online: form.message_online?.trim() || null,
      message_offline: form.message_offline?.trim() || null,
      message_update_required: form.message_update_required?.trim() || null,
      message_maintenance: form.message_maintenance?.trim() || null,
      download_url: form.download_url?.trim() || null,
    };

    let result;
    if (editApp) {
      result = await supabase.from("app_status").update(payload).eq("id", editApp.id);
    } else {
      result = await supabase.from("app_status").insert(payload);
    }

    if (result.error) {
      setError(
        result.error.message.includes("unique")
          ? "Esse App ID já existe."
          : result.error.message
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    setDialogOpen(false);
    fetchApps();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    await supabase.from("app_status").delete().eq("id", id);
    fetchApps();
  };

  const inputClass =
    "w-full rounded-lg border border-border/40 bg-background/50 px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

  return (
    <>
      <div className="rounded-2xl border border-border/40 bg-card/40 p-6 backdrop-blur-2xl shadow-[0_8px_60px_-12px_rgba(59,130,246,0.12)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-card-foreground">App Status</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie o status das aplicações (endpoint público)
            </p>
          </div>
          <button
            onClick={() => openDialog()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Novo App
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : apps.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            Nenhum app cadastrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">App ID</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Versão</th>
                  <th className="pb-3 font-medium">Manutenção</th>
                  <th className="pb-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => {
                  const color = statusColors[a.status] || statusColors.offline;
                  return (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="py-4">
                        <code className="rounded bg-accent px-2 py-1 text-xs font-medium text-foreground">
                          {a.app_id}
                        </code>
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium ${color.bg}`}
                        >
                          <Circle className={`h-2 w-2 fill-current ${color.dot}`} />
                          <span className={color.dot}>{a.status}</span>
                        </span>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">
                        v{a.current_version}
                      </td>
                      <td className="py-4">
                        {a.maintenance ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-400">
                            Em manutenção
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDialog(a)}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-card-foreground">
                {editApp ? "Editar App" : "Novo App"}
              </h2>
              <button
                onClick={() => setDialogOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">App ID *</label>
                <input
                  type="text"
                  value={form.app_id}
                  onChange={(e) => setForm({ ...form, app_id: e.target.value })}
                  className={inputClass}
                  placeholder="ex: aimbot_elevate"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className={inputClass}
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/50 px-4 py-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={form.maintenance}
                      onChange={(e) => setForm({ ...form, maintenance: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-foreground">Em manutenção</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Versão Atual</label>
                  <input
                    type="text"
                    value={form.current_version}
                    onChange={(e) => setForm({ ...form, current_version: e.target.value })}
                    className={inputClass}
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Versão Mínima</label>
                  <input
                    type="text"
                    value={form.min_version}
                    onChange={(e) => setForm({ ...form, min_version: e.target.value })}
                    className={inputClass}
                    placeholder="1.0"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Mensagem padrão</label>
                <input type="text" value={form.message || ""} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputClass} placeholder="Mensagem geral (opcional)" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Mensagem Online</label>
                <input type="text" value={form.message_online || ""} onChange={(e) => setForm({ ...form, message_online: e.target.value })} className={inputClass} placeholder="Aplicação funcionando normalmente." />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Mensagem Offline</label>
                <input type="text" value={form.message_offline || ""} onChange={(e) => setForm({ ...form, message_offline: e.target.value })} className={inputClass} placeholder="Aplicação está offline." />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Mensagem Atualização</label>
                <input type="text" value={form.message_update_required || ""} onChange={(e) => setForm({ ...form, message_update_required: e.target.value })} className={inputClass} placeholder="Nova versão disponível." />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Mensagem Manutenção</label>
                <input type="text" value={form.message_maintenance || ""} onChange={(e) => setForm({ ...form, message_maintenance: e.target.value })} className={inputClass} placeholder="Em manutenção, tente mais tarde." />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Download URL</label>
                <input type="text" value={form.download_url || ""} onChange={(e) => setForm({ ...form, download_url: e.target.value })} className={inputClass} placeholder="https://exemplo.com/download.exe" />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editApp ? "Salvar Alterações" : "Cadastrar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AppStatusTab;
