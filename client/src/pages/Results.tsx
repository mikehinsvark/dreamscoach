import { MetricEditor } from "@/components/MetricEditor";
import { trpc } from "@/lib/trpc";
import { prospectMetrics, type ProspectMetrics } from "@shared/prospect";
import { ArrowRight, Check, ClipboardCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type WeeklyPlan = {
  goal: { id: number; weekStart: string } & ProspectMetrics;
  result: unknown;
};

type ReviewData = {
  weeklyGoalId: number;
  attainment: { average: number; categories: Array<{ key: string; goal: number; actual: number; percentage: number | null }> };
  coaching: { message: string };
};

export default function Results() {
  const dashboard = trpc.prospect.myDashboard.useQuery();
  const [review, setReview] = useState<ReviewData | null>(null);
  const submit = trpc.prospect.submitResults.useMutation({
    onSuccess: (data, input) => {
      setReview({ weeklyGoalId: input.weeklyGoalId, attainment: data.attainment, coaching: data.coaching });
      dashboard.refetch();
    },
  });
  const saveCommitment = trpc.prospect.completeCommitment.useMutation({ onSuccess: () => dashboard.refetch() });
  const openPlans = useMemo(() => ((dashboard.data?.timeline ?? []) as unknown as WeeklyPlan[]).filter((item) => !item.result), [dashboard.data]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = openPlans.find((item) => item.goal.id === selectedId) ?? openPlans[0];
  const [actuals, setActuals] = useState<ProspectMetrics | null>(null);
  const [reflection, setReflection] = useState("");
  const [commitment, setCommitment] = useState("");
  useEffect(() => {
    if (selected) {
      setSelectedId(selected.goal.id);
      setActuals({ phoneHours: selected.goal.phoneHours, recruits: selected.goal.recruits, outreachContacts: selected.goal.outreachContacts, submittedApplications: selected.goal.submittedApplications, pipelineAppointments: selected.goal.pipelineAppointments, engagements: selected.goal.engagements, closedGcv: selected.goal.closedGcv, targetProspects: selected.goal.targetProspects });
      setReview(null);
      setCommitment("");
    }
  }, [selected?.goal.id]);

  if (dashboard.isLoading) return <div className="workspace-state">Loading your plans…</div>;
  if (!selected || !actuals) return <div className="workspace-empty"><ClipboardCheck className="h-7 w-7" /><h1>No open weekly plans.</h1><p>Save a new weekly plan before entering results.</p><a href="/app">Create a weekly plan <ArrowRight className="h-4 w-4" /></a></div>;

  if (review) {
    return <div className="workspace-page">
      <header className="workspace-page-heading compact"><div><p className="workspace-overline">Category review</p><h1>See each signal.<br /><em>Choose the next move.</em></h1><p>Review every goal beside the actual activity before completing your weekly commitment.</p></div></header>
      <section className="workspace-panel review-panel"><div className="review-score"><span>Overall planning signal</span><strong>{review.attainment.average}%</strong></div><div className="review-grid">{review.attainment.categories.map((category) => { const metric = prospectMetrics.find((item) => item.key === category.key)!; return <article key={category.key} style={{ "--review": metric.color } as React.CSSProperties}><b>{metric.letter}</b><div><span>{metric.shortLabel}</span><p>Goal <strong>{category.goal}</strong> · Actual <strong>{category.actual}</strong></p></div><output>{category.percentage === null ? "Not planned" : `${category.percentage}%`}</output></article>; })}</div><div className="coaching-result"><Sparkles className="h-5 w-5" /><div><span>Supportive coaching note</span><p>{review.coaching.message}</p></div></div><label className="commitment-field">Your next-week commitment<textarea value={commitment} onChange={(event) => setCommitment(event.target.value)} placeholder="Write one specific, calendar-ready action you will protect next week." maxLength={800} /></label><button className="workspace-primary" disabled={commitment.trim().length < 3 || saveCommitment.isPending} type="button" onClick={() => saveCommitment.mutate({ weeklyGoalId: review.weeklyGoalId, commitment: commitment.trim() })}>{saveCommitment.isPending ? "Saving commitment…" : "Complete weekly review"}<Check className="h-4 w-4" /></button>{saveCommitment.data && <p className="workspace-success"><Check className="h-4 w-4" /> Commitment saved to your secure weekly record.</p>}</section>
    </div>;
  }

  return <div className="workspace-page">
    <header className="workspace-page-heading compact"><div><p className="workspace-overline">Week-end review</p><h1>Record the work.<br /><em>Keep the lesson.</em></h1></div><div className="workspace-select-wrap"><label>Plan period<select value={selected.goal.id} onChange={(event) => setSelectedId(Number(event.target.value))}>{openPlans.map((item) => <option value={item.goal.id} key={item.goal.id}>{item.goal.weekStart}</option>)}</select></label></div></header>
    <section className="workspace-panel results-panel"><div className="workspace-panel-title"><span>02</span><div><p>Actual activity</p><h2>What happened this week?</h2></div></div><MetricEditor values={actuals} onChange={(key, value) => setActuals((current) => current ? { ...current, [key]: value } : current)} /><div className="reflection-grid"><label>Short reflection<textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="What created momentum or got in the way?" maxLength={2000} /></label><div className="review-prompt"><ClipboardCheck className="h-5 w-5" /><p>After saving actuals, you will review every category goal-versus-actual before adding your commitment.</p></div></div><button className="workspace-primary" type="button" disabled={submit.isPending} onClick={() => submit.mutate({ weeklyGoalId: selected.goal.id, actuals, reflection: reflection || null, commitment: null })}>{submit.isPending ? "Saving results…" : "Save results & open review"}<ArrowRight className="h-4 w-4" /></button>{submit.error && <p className="workspace-error">{submit.error.message}</p>}</section>
  </div>;
}
