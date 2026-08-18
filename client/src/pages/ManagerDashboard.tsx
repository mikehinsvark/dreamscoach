import { trpc } from "@/lib/trpc";
import { Cloud, LockKeyhole, Users } from "lucide-react";

export default function ManagerDashboard() {
  const team = trpc.prospect.teamDashboard.useQuery();
  const integration = trpc.prospect.integrationPublicStatus.useQuery();
  if (team.isLoading) return <div className="workspace-state">Loading the authorized team view…</div>;
  if (team.error) return <div className="workspace-empty"><LockKeyhole className="h-7 w-7" /><h1>Manager access is required.</h1><p>This view is limited to managers and administrators with authorized team records.</p></div>;
  return <div className="workspace-page">
    <header className="workspace-page-heading compact"><div><p className="workspace-overline">Manager workspace</p><h1>Team activity,<br /><em>with boundaries.</em></h1><p>Only explicitly assigned representatives appear in this secure overview.</p></div><div className="workspace-date-card manager"><Users className="h-5 w-5" /><span>{team.data?.length ?? 0}<small>Authorized reps</small></span></div></header>
    <section className="workspace-panel manager-panel"><div className="workspace-panel-title"><span>Team</span><div><p>Weekly completion</p><h2>Authorized visibility</h2></div></div>{team.data?.length ? <div className="team-table"><div className="team-table-head"><span>Representative</span><span>Latest plan</span><span>Plans</span><span>Reviews</span></div>{team.data.map((item) => <div className="team-table-row" key={item.rep.id}><span><b>{item.rep.name?.slice(0, 1).toUpperCase() ?? "R"}</b><i>{item.rep.name ?? item.rep.email ?? "Representative"}</i></span><span>{item.latestWeek ?? "No plan saved"}</span><span>{item.plannedWeeks}</span><span>{item.completedWeeks}</span></div>)}</div> : <div className="manager-empty"><Users className="h-6 w-6" /><p>No representatives have been assigned to this manager yet. An administrator can assign reps through the protected account controls.</p></div>}</section>
    <section className="ghl-status-card"><Cloud className="h-5 w-5" /><div><p>GoHighLevel Dreams Cloud</p><strong>{integration.data?.active ? "Weekly sync is active" : integration.data?.message ?? "Connection status loading"}</strong><small>Saved plans and completed reviews are written to an internal delivery ledger. They are transmitted only after an administrator enables the shared company webhook.</small></div></section>
  </div>;
}
