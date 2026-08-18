import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, NOT_ADMIN_ERR_MSG } from "@shared/const";
import {
  assignRepToManager,
  getWeeklyGoalForRep,
  getWeeklyResultForRepAndGoal,
  getCrmConnection,
  listAllReps,
  listCoachingReportsForResults,
  listManagerRepIds,
  listRepsByIds,
  listWeeklyGoalsForRep,
  listWeeklyGoalsForReps,
  listWeeklyResultsForGoals,
  listWeeklyResultsForRep,
  saveCoachingReport,
  saveWeeklyGoals,
  saveWeeklyCommitment,
  setCrmConnection,
  saveWeeklyResults,
  upsertCrmContactLink,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { syncToGhlDreamsCloud } from "./ghl";
import { canReviewTeam } from "./access";
import {
  calculateAttainment,
  createCoachingMessage,
  isMondayWeekStart,
  prospectMetricKeys,
  type ProspectMetrics,
} from "../shared/prospect";

const metricInput = z.object({
  phoneHours: z.number().int().min(0).max(40),
  recruits: z.number().int().min(0).max(10),
  outreachContacts: z.number().int().min(0).max(150),
  submittedApplications: z.number().int().min(0).max(20),
  pipelineAppointments: z.number().int().min(0).max(50),
  engagements: z.number().int().min(0).max(30),
  closedGcv: z.number().int().min(0).max(50000),
  targetProspects: z.number().int().min(0).max(100),
});

const weekInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!canReviewTeam(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Manager access is required" });
  }
  return next({ ctx });
});

function toMetrics(source: Record<string, unknown>): ProspectMetrics {
  return Object.fromEntries(prospectMetricKeys.map((key) => [key, Number(source[key] ?? 0)])) as ProspectMetrics;
}

function makeDashboard(goals: Array<Record<string, unknown>>, results: Array<Record<string, unknown>>, reports: Array<Record<string, unknown>>) {
  const resultByGoal = new Map(results.map((result) => [Number(result.weeklyGoalId), result]));
  const reportByResult = new Map(reports.map((report) => [Number(report.weeklyResultId), report]));
  const timeline = goals.map((goal) => {
    const result = resultByGoal.get(Number(goal.id));
    const goalsMetric = toMetrics(goal as Record<string, unknown>);
    const actualMetrics = result ? toMetrics(result as Record<string, unknown>) : null;
    const attainment = actualMetrics ? calculateAttainment(goalsMetric, actualMetrics) : null;
    return {
      goal,
      result: result ?? null,
      attainment,
      coaching: result ? reportByResult.get(Number(result.id)) ?? null : null,
    };
  });
  const completed = timeline.filter((item) => item.result).length;
  const averageAttainment = completed
    ? Math.round(timeline.reduce((sum, item) => sum + (item.attainment?.average ?? 0), 0) / completed)
    : 0;
  return { timeline, summary: { plannedWeeks: goals.length, completedWeeks: completed, averageAttainment } };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  prospect: router({
    saveGoals: protectedProcedure
      .input(z.object({ weekStart: weekInput, goals: metricInput }))
      .mutation(async ({ ctx, input }) => {
        if (!isMondayWeekStart(input.weekStart)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a Monday as the week start date" });
        }
        const goal = await saveWeeklyGoals(ctx.user.id, input.weekStart, input.goals);
        const sync = await syncToGhlDreamsCloud({
          repId: ctx.user.id,
          repName: ctx.user.name,
          repEmail: ctx.user.email,
          eventType: "weekly_plan_saved",
          weeklyGoalId: goal.id,
          weekStart: input.weekStart,
          goals: input.goals,
        });
        return { goal, sync };
      }),

    myDashboard: protectedProcedure.query(async ({ ctx }) => {
      const goals = await listWeeklyGoalsForRep(ctx.user.id);
      const results = await listWeeklyResultsForRep(ctx.user.id);
      const reports = await listCoachingReportsForResults(results.map((result) => result.id));
      return makeDashboard(goals as Array<Record<string, unknown>>, results as Array<Record<string, unknown>>, reports as Array<Record<string, unknown>>);
    }),

    submitResults: protectedProcedure
      .input(z.object({ weeklyGoalId: z.number().int().positive(), actuals: metricInput, reflection: z.string().max(2000).nullable(), commitment: z.string().max(800).nullable() }))
      .mutation(async ({ ctx, input }) => {
        const goal = await getWeeklyGoalForRep(ctx.user.id, input.weeklyGoalId);
        if (!goal) throw new TRPCError({ code: "NOT_FOUND", message: "That weekly plan was not found" });
        const result = await saveWeeklyResults(ctx.user.id, goal.id, input.actuals, input.reflection, input.commitment);
        const attainment = calculateAttainment(toMetrics(goal), input.actuals);
        const coaching = await saveCoachingReport(ctx.user.id, result.id, attainment.average, createCoachingMessage(attainment.average));
        const sync = await syncToGhlDreamsCloud({
          repId: ctx.user.id,
          repName: ctx.user.name,
          repEmail: ctx.user.email,
          eventType: "weekly_result_submitted",
          weeklyGoalId: goal.id,
          weeklyResultId: result.id,
          weekStart: goal.weekStart,
          goals: toMetrics(goal),
          actuals: input.actuals,
          attainmentPercent: attainment.average,
          commitment: input.commitment,
        });
        return { result, attainment, coaching, sync };
      }),

    completeCommitment: protectedProcedure
      .input(z.object({ weeklyGoalId: z.number().int().positive(), commitment: z.string().min(3).max(800) }))
      .mutation(async ({ ctx, input }) => {
        const result = await getWeeklyResultForRepAndGoal(ctx.user.id, input.weeklyGoalId);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Submit results before saving a commitment" });
        const updated = await saveWeeklyCommitment(ctx.user.id, input.weeklyGoalId, input.commitment);
        return { result: updated };
      }),

    teamDashboard: managerProcedure.query(async ({ ctx }) => {
      const reps = ctx.user.role === "admin" ? await listAllReps() : await listRepsByIds(await listManagerRepIds(ctx.user.id));
      const goals = await listWeeklyGoalsForReps(reps.map((rep) => rep.id));
      const results = await listWeeklyResultsForGoals(goals.map((goal) => goal.id));
      const resultsByRep = new Map<number, typeof results>();
      results.forEach((result) => resultsByRep.set(result.repId, [...(resultsByRep.get(result.repId) ?? []), result]));
      const goalsByRep = new Map<number, typeof goals>();
      goals.forEach((goal) => goalsByRep.set(goal.repId, [...(goalsByRep.get(goal.repId) ?? []), goal]));
      return reps.map((rep) => {
        const repGoals = goalsByRep.get(rep.id) ?? [];
        const repResults = resultsByRep.get(rep.id) ?? [];
        const resultGoalIds = new Set(repResults.map((result) => result.weeklyGoalId));
        return {
          rep: { id: rep.id, name: rep.name, email: rep.email, role: rep.role },
          plannedWeeks: repGoals.length,
          completedWeeks: resultGoalIds.size,
          latestWeek: repGoals[0]?.weekStart ?? null,
        };
      });
    }),

    linkGhlContact: adminProcedure.input(z.object({ userId: z.number().int().positive(), ghlContactId: z.string().min(1).max(128) })).mutation(async ({ input }) => {
      await upsertCrmContactLink(input.userId, input.ghlContactId);
      return { success: true };
    }),

    assignManager: adminProcedure.input(z.object({ managerId: z.number().int().positive(), repId: z.number().int().positive() })).mutation(async ({ input }) => {
      await assignRepToManager(input.managerId, input.repId);
      return { success: true };
    }),

    integrationPublicStatus: protectedProcedure.query(async () => {
      const connection = await getCrmConnection("ghl_dreams_cloud");
      const configured = Boolean(process.env.GHL_DREAMS_CLOUD_WEBHOOK_URL);
      return {
        provider: "GoHighLevel Dreams Cloud",
        active: configured && Boolean(connection?.enabled),
        message: configured ? "Company endpoint configured" : "Company endpoint not configured",
      };
    }),

    integrationStatus: adminProcedure.query(async () => {
      const connection = await getCrmConnection("ghl_dreams_cloud");
      const configured = Boolean(process.env.GHL_DREAMS_CLOUD_WEBHOOK_URL);
      return { provider: "GoHighLevel Dreams Cloud", configured, enabled: Boolean(connection?.enabled), active: configured && Boolean(connection?.enabled), mode: "company webhook" };
    }),

    setIntegrationStatus: adminProcedure.input(z.object({ enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      const connection = await setCrmConnection("ghl_dreams_cloud", input.enabled, ctx.user.id);
      return { provider: "GoHighLevel Dreams Cloud", configured: Boolean(process.env.GHL_DREAMS_CLOUD_WEBHOOK_URL), enabled: connection?.enabled ?? false };
    }),
  }),
});

export type AppRouter = typeof appRouter;
