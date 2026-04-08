import type { DashboardAlert } from "@/types/finvoice";

export function AlertsList({ alerts }: { alerts: DashboardAlert[] }) {
  if (!alerts.length) return null;
  return (
    <div className="fv-alerts" role="list">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={`fv-alert ${a.type === "danger" ? "fv-alert-danger" : "fv-alert-warning"}`}
          role="listitem"
        >
          {a.message}
        </div>
      ))}
    </div>
  );
}
