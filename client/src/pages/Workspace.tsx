import { MetricEditor } from "@/components/MetricEditor";
import { trpc } from "@/lib/trpc";
import { defaultProspectGoals, type ProspectMetrics } from "@shared/prospect";
import { CalendarDays, Check, Cloud, Save, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

function currentMonday() {
  const today = new Date();
  const offset = (today.getDay() + 6) % 7;
  today.setDate(today.getDate() - offset);
  return today.toISOString().slice(0, 10);
}

export default function Workspace() {
  const [weekStart, setWeekStart] = useState(currentMonday);
  const [weekError, setWeekError] = useState("");
  const [goals, setGoals] = useState<ProspectMetrics>(defaultProspectGoals);
  const saveGoals = trpc.prospect.saveGoals.useMutation();
  const annualEstimate = useMemo(() => goals.closedGcv * 52, [goals.closedGcv]);
  const configured = saveGoals.data?.sync.status === "delivered";
  const saveWeeklyPlan = () => {
    const date = new Date(`${weekStart}T12:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.getUTCDay() !== 1) {
      setWeekError("Please select a Monday so every goal and result belongs to the same planning week.");
      return;
    }
    setWeekError("");
    saveGoals.mutate({ weekStart, goals });
  };

  return <div className="workspace-page">
    <header className="workspace-page-heading">
      <div><p className="workspace-overline">Weekly planning</p><h1>Make the week<br /><em>visible.</em></h1><p>Set the controllable activity targets that deserve protected time this week.</p></div>
      <div><div className="workspace-date-card"><CalendarDays className="h-5 w-5" /><label>Week starting<input type="date" value={weekStart} onChange={(event) => { setWeekStart(event.target.value); setWeekError(""); }} /></label></div>{weekError && <p className="workspace-date-error">{weekError}</p>}</div>
    </header>
    <div className="workspace-two-column">
      <section className="workspace-panel plan-panel"><div className="workspace-panel-title"><span>01</span><div><p>Eight activity signals</p><h2>Set the targets.</h2></div></div><MetricEditor values={goals} onChange={(key, value) => setGoals((current) => ({ ...current, [key]: value }))} /><button className="workspace-primary" type="button" disabled={saveGoals.isPending} onClick={saveWeeklyPlan}><Save className="h-4 w-4" />{saveGoals.isPending ? "Saving plan…" : "Save my weekly plan"}</button>{saveGoals.error && <p className="workspace-error">{saveGoals.error.message}</p>}{saveGoals.data && <p className="workspace-success"><Check className="h-4 w-4" /> Plan saved securely. Dreams Cloud sync is {configured ? "active" : "ready when configured"}.</p>}</section>
      <aside className="workspace-summary-card"><div className="workspace-summary-top"><span>Planning ledger</span><ShieldCheck className="h-4 w-4" /></div><p>Selected Closed GCV goal</p><strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(goals.closedGcv)}</strong><div className="workspace-summary-rule" /><p>Annualized planning view</p><b>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(annualEstimate)}</b><small>A 52-week planning estimate based only on your chosen target. It is not a forecast of compensation or results.</small><div className="workspace-crm-line"><Cloud className="h-4 w-4" /><span>GoHighLevel Dreams Cloud<br /><em>{saveGoals.data?.sync.status === "delivered" ? "Weekly plan delivered" : "Company connection ready"}</em></span></div></aside>
    </div>
  </div>;
}
