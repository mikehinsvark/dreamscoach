import { trpc } from "@/lib/trpc";
import { prospectMetrics } from "@shared/prospect";
import { ArrowRight, BarChart3, ClipboardList, Target } from "lucide-react";

export default function RepDashboard() {
  const dashboard = trpc.prospect.myDashboard.useQuery();
  if (dashboard.isLoading) return <div className="workspace-state">Building your dashboard…</div>;
  const latest = dashboard.data?.timeline[0] as any;
  return <div className="workspace-page">
    <header className="workspace-page-heading compact"><div><p className="workspace-overline">Progress dashboard</p><h1>See the work.<br /><em>Choose the next move.</em></h1></div><a className="workspace-inline-link" href="/app/results">Submit latest results <ArrowRight className="h-4 w-4" /></a></header>
    <div className="dashboard-stat-row"><article><Target className="h-5 w-5" /><span>Planned weeks</span><strong>{dashboard.data?.summary.plannedWeeks ?? 0}</strong></article><article><ClipboardList className="h-5 w-5" /><span>Completed reviews</span><strong>{dashboard.data?.summary.completedWeeks ?? 0}</strong></article><article><BarChart3 className="h-5 w-5" /><span>Average attainment</span><strong>{dashboard.data?.summary.averageAttainment ?? 0}%</strong></article></div>
    {!latest ? <div className="workspace-empty"><Target className="h-7 w-7" /><h1>Your planning record starts here.</h1><p>Create your first saved weekly plan to build a private performance view.</p><a href="/app">Set this week&apos;s goals <ArrowRight className="h-4 w-4" /></a></div> : <section className="workspace-panel dashboard-panel"><div className="workspace-panel-title"><span>Latest</span><div><p>Week of {latest.goal.weekStart}</p><h2>{latest.result ? "Goal versus actual" : "Plan ready for review"}</h2></div></div>{latest.result && latest.attainment ? <><div className="dashboard-bars">{latest.attainment.categories.map((category: { key: string; percentage: number | null }) => { const metric = prospectMetrics.find((item) => item.key === category.key)!; return <div className="dashboard-bar" key={category.key}><span>{metric.letter}</span><div><strong>{metric.shortLabel}</strong><i><b style={{ width: `${Math.min(category.percentage ?? 0, 120)}%`, background: metric.color }} /></i></div><output>{category.percentage ?? "—"}%</output></div>; })}</div>{latest.coaching && <div className="dashboard-coaching"><span>Coaching note</span><p>{latest.coaching.message}</p></div>}</> : <div className="dashboard-pending"><p>This plan has been saved securely. Enter your weekly results to create the comparison and coaching note.</p><a href="/app/results">Record results <ArrowRight className="h-4 w-4" /></a></div>}</section>}
  </div>;
}
