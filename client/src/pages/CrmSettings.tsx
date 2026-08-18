import { trpc } from "@/lib/trpc";
import { Cloud, Power, ShieldCheck } from "lucide-react";

export default function CrmSettings() {
  const status = trpc.prospect.integrationStatus.useQuery();
  const setStatus = trpc.prospect.setIntegrationStatus.useMutation({ onSuccess: () => status.refetch() });
  if (status.isLoading) return <div className="workspace-state">Loading company connection…</div>;
  if (status.error) return <div className="workspace-empty"><ShieldCheck className="h-7 w-7" /><h1>Administrator access required.</h1><p>Only administrators can control the company Dreams Cloud connection.</p></div>;
  const active = Boolean(status.data?.active);
  return <div className="workspace-page">
    <header className="workspace-page-heading compact"><div><p className="workspace-overline">Company connection</p><h1>Control the handoff.<br /><em>Protect the record.</em></h1><p>The webhook endpoint remains a protected server secret. This control governs whether saved plans and submitted reviews are allowed to leave Prospect Coach.</p></div></header>
    <section className="workspace-panel crm-settings-panel"><div className="crm-setting-icon"><Cloud className="h-6 w-6" /></div><div><p className="workspace-overline">GoHighLevel Dreams Cloud</p><h2>{active ? "Weekly sync is active" : "Weekly sync is paused"}</h2><p>{status.data?.configured ? "Your company endpoint is configured and was connection-tested. Enable this setting only when the Dreams Cloud workflow is ready to receive live rep activity." : "A company webhook URL has not been configured. The secure endpoint must be set before weekly delivery can be enabled."}</p></div><button type="button" className={active ? "workspace-secondary" : "workspace-primary"} disabled={!status.data?.configured || setStatus.isPending} onClick={() => setStatus.mutate({ enabled: !active })}><Power className="h-4 w-4" />{setStatus.isPending ? "Updating…" : active ? "Pause weekly sync" : "Enable weekly sync"}</button><small><ShieldCheck className="h-3.5 w-3.5" />An internal delivery record is created for every saved plan and completed review. Only enabled delivery attempts reach the company endpoint.</small></section>
  </div>;
}
