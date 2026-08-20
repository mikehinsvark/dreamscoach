export const prospectMetricKeys = [
  "phoneHours",
  "recruits",
  "outreachContacts",
  "submittedApplications",
  "pipelineAppointments",
  "engagements",
  "closedGcv",
  "targetProspects",
] as const;

export type ProspectMetricKey = (typeof prospectMetricKeys)[number];
export type ProspectMetrics = Record<ProspectMetricKey, number>;

export const prospectMetrics: Array<{
  key: ProspectMetricKey;
  letter: string;
  label: string;
  shortLabel: string;
  unit: string;
  max: number;
  step: number;
  color: string;
}> = [
  { key: "phoneHours", letter: "P", label: "Phone Prospecting Hours", shortLabel: "Phone", unit: "hrs", max: 40, step: 1, color: "#1D5FE9" },
  { key: "recruits", letter: "R", label: "Strategic Partners", shortLabel: "Partners", unit: "partners", max: 10, step: 1, color: "#8A42E8" },
  { key: "outreachContacts", letter: "O", label: "Outreach Contacts", shortLabel: "Outreach", unit: "contacts", max: 150, step: 5, color: "#008A88" },
  { key: "submittedApplications", letter: "S", label: "Submitted Applications", shortLabel: "Submitted", unit: "applications", max: 20, step: 1, color: "#D66A04" },
  { key: "pipelineAppointments", letter: "P", label: "Prospects Added to Pipeline", shortLabel: "Pipeline", unit: "appointments", max: 50, step: 1, color: "#CF306C" },
  { key: "engagements", letter: "E", label: "Engagements", shortLabel: "Engagements", unit: "meetings", max: 30, step: 1, color: "#5D7932" },
  { key: "closedGcv", letter: "C", label: "Closed GCV", shortLabel: "Closed", unit: "GCV", max: 50000, step: 500, color: "#BD8212" },
  { key: "targetProspects", letter: "T", label: "Target New Prospects", shortLabel: "Target", unit: "prospects", max: 100, step: 5, color: "#2578A9" },
];

export const defaultProspectGoals: ProspectMetrics = {
  phoneHours: 15,
  recruits: 1,
  outreachContacts: 40,
  submittedApplications: 4,
  pipelineAppointments: 10,
  engagements: 6,
  closedGcv: 5000,
  targetProspects: 20,
};

export function calculateAttainment(goals: ProspectMetrics, actuals: ProspectMetrics) {
  const categories = prospectMetricKeys.map((key) => {
    const goal = goals[key];
    const actual = actuals[key];
    const percentage = goal > 0 ? Math.round((actual / goal) * 100) : actual > 0 ? 100 : null;
    return { key, goal, actual, percentage };
  });
  const plannedCategories = categories.filter((category) => category.percentage !== null);
  const average = plannedCategories.length
    ? Math.round(plannedCategories.reduce((sum, category) => sum + (category.percentage ?? 0), 0) / plannedCategories.length)
    : 0;
  return { categories, average };
}

export function createCoachingMessage(attainmentPercent: number) {
  if (attainmentPercent >= 100) {
    return "You met or exceeded the weekly activity plan. Capture what you protected, then choose one repeatable action to carry into the next week.";
  }
  if (attainmentPercent >= 75) {
    return "You built meaningful activity this week. Review the one or two categories with the clearest gap and protect a specific time block for them next week.";
  }
  if (attainmentPercent >= 40) {
    return "This review is a planning signal, not a verdict. Pick one controllable activity category, reduce the next step to something calendar-ready, and recommit to the next week.";
  }
  return "Start with a smaller, visible commitment. Choose one activity you can schedule and complete early next week, then build the rest of the plan around that protected action.";
}

export function isMondayWeekStart(value: string) {
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.getUTCDay() === 1;
}
