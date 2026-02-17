import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Download, RefreshCw, Monitor, Key, Filter,
} from "lucide-react";

type EventType = "download" | "hwid_reset" | "app_launch";

interface ActivityLog {
  id: string;
  event_type: EventType;
  license_key: string | null;
  software_name: string | null;
  hwid: string | null;
  ip_address: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const eventConfig: Record<EventType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  download: {
    label: "Download",
    icon: <Download className="h-3.5 w-3.5" />,
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/30",
  },
  hwid_reset: {
    label: "HWID Reset",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/30",
  },
  app_launch: {
    label: "App Launch",
    icon: <Monitor className="h-3.5 w-3.5" />,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/30",
  },
};

const ActivityLogsTab = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EventType | "all">("all");

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (filter !== "all") {
      query = query.eq("event_type", filter);
    }

    const { data } = await query;
    setLogs((data as ActivityLog[]) || []);
    setLoading(false);
  };

  const filters: { id: EventType | "all"; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "download", label: "Downloads" },
    { id: "hwid_reset", label: "HWID Reset" },
    { id: "app_launch", label: "App Launch" },
  ];

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-6 backdrop-blur-2xl shadow-[0_8px_60px_-12px_rgba(59,130,246,0.12)]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-card-foreground">Logs de Atividade</h2>
          <p className="text-sm text-muted-foreground">
            Downloads, resets de HWID e lançamentos de aplicação
          </p>
        </div>
        <button
          onClick={() => fetchLogs()}
          className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-1 rounded-lg border border-border/40 bg-background/30 p-1 w-fit">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              filter === f.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.id === "all" ? <Filter className="h-3 w-3" /> : eventConfig[f.id].icon}
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Nenhum log encontrado.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Evento</th>
                <th className="pb-3 font-medium">Software</th>
                <th className="pb-3 font-medium">License Key</th>
                <th className="pb-3 font-medium">IP</th>
                <th className="pb-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const cfg = eventConfig[log.event_type] || eventConfig.download;
                return (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${cfg.bg}`}
                      >
                        <span className={cfg.color}>{cfg.icon}</span>
                        <span className={cfg.color}>{cfg.label}</span>
                      </span>
                    </td>
                    <td className="py-3">
                      {log.software_name ? (
                        <span className="text-sm font-medium text-card-foreground">
                          {log.software_name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      {log.license_key ? (
                        <code className="rounded bg-accent px-2 py-1 text-xs text-muted-foreground">
                          {log.license_key.length > 24
                            ? `${log.license_key.substring(0, 24)}...`
                            : log.license_key}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      {log.ip_address ? (
                        <code className="rounded bg-accent px-2 py-1 text-xs text-muted-foreground">
                          {log.ip_address}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActivityLogsTab;
