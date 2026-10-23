import { z } from "zod";
export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function addDays(date: string, n: number) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + n);
  return localDate(d);
}
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => localDate(new Date(v + "T12:00:00")) === v, "Data inválida");
export const profileSchema = z.object({
  name: z.string().max(60),
  age: z.enum(["18–39", "40–59", "60+", "Menos de 18"]),
  experience: z.enum(["Iniciante", "Retomando", "Pratico regularmente"]),
  days: z.number().int().min(2).max(3),
  minutes: z.number().int().min(5).max(30),
  equipment: z.array(z.enum(["Cadeira", "Parede", "Cargas leves", "Elástico"])),
  space: z.enum(["Pequeno", "Livre"]),
  floor: z.boolean(),
  limitations: z.string().max(1000),
  pregnancy: z.enum([
    "Não se aplica",
    "Gestação",
    "Recuperação do parto",
    "Prefiro orientação individual",
  ]),
  pelvic: z.boolean(),
  goals: z.string().max(300),
  weight: z.string().max(30),
  waist: z.string().max(30),
});
export type Profile = z.infer<typeof profileSchema>;
export const defaultProfile: Profile = {
  name: "",
  age: "18–39",
  experience: "Iniciante",
  days: 2,
  minutes: 15,
  equipment: ["Cadeira", "Parede"],
  space: "Pequeno",
  floor: false,
  limitations: "",
  pregnancy: "Não se aplica",
  pelvic: false,
  goals: "Força e resistência",
  weight: "",
  waist: "",
};
export const needsReview = (p: Profile) =>
  p.age === "Menos de 18" ||
  !!p.limitations.trim() ||
  p.pregnancy !== "Não se aplica" ||
  p.pelvic;
const planItem = z.object({
  id: z.string(),
  date: day,
  kind: z.enum(["A", "B", "C", "Movimento", "Mobilidade", "Descanso"]),
  original: day,
});
const effortSchema = z.enum(["Leve", "Moderado", "Difícil"]);
const session = z.object({
  id: z.string(),
  planId: z.string(),
  date: day,
  kind: z.string(),
  started: z.number(),
  ended: z.number(),
  partial: z.boolean(),
  steps: z.number().int().nonnegative(),
  effort: effortSchema,
  pain: z.boolean(),
  readiness: z.string(),
  reps: z.number().int().min(0).max(100),
  resistance: z.string().max(100),
  notes: z.string().max(500),
});
const active = z.object({
  id: z.string(),
  planId: z.string(),
  kind: z.enum(["A", "B", "C"]),
  short: z.boolean(),
  index: z.number().int().min(0).max(30),
  remaining: z.number().min(0).max(3600),
  deadline: z.number().nullable(),
  started: z.number(),
  readiness: z.string(),
  reps: z.number().int().min(3).max(12),
  easy: z.boolean(),
});
export const dataSchema = z
  .object({
    version: z.literal(1),
    profile: profileSchema.nullable(),
    plan: z.array(planItem).max(200),
    sessions: z.array(session).max(10000),
    active: active.nullable(),
    reps: z.number().int().min(3).max(12),
    meals: z.string().max(10000),
    shopping: z.string().max(10000),
    lastBackup: z.iso.datetime().nullable(),
  })
  .superRefine((d, c) => {
    if (new Set(d.sessions.map((s) => s.planId)).size !== d.sessions.length)
      c.addIssue({ code: "custom", message: "Sessões duplicadas" });
    if (new Set(d.plan.map((p) => p.id)).size !== d.plan.length)
      c.addIssue({ code: "custom", message: "Plano duplicado" });
  });
export type Data = z.infer<typeof dataSchema>;
export type Active = NonNullable<Data["active"]>;
export const initialData: Data = {
  version: 1,
  profile: null,
  plan: [],
  sessions: [],
  active: null,
  reps: 5,
  meals:
    "Café: fruta, aveia e iogurte\nAlmoço: arroz, feijão, legumes e ovo\nJantar: sopa de legumes com lentilha e pão",
  shopping:
    "Arroz\nFeijão\nOvos\nLegumes da estação\nFrutas\nAveia\nIogurte natural",
  lastBackup: null,
};
export function makePlan(start: string, optional = false) {
  return Array.from({ length: 28 }, (_, i) => {
    const kind: Data["plan"][number]["kind"] =
      i % 7 === 0
        ? "A"
        : i % 7 === 3
          ? "B"
          : i % 7 === 5 && optional
            ? "C"
            : i % 7 === 1 || i % 7 === 4
              ? "Movimento"
              : i % 7 === 2
                ? "Mobilidade"
                : "Descanso";
    return {
      id: `p-${start}-${i}`,
      date: addDays(start, i),
      original: addDays(start, i),
      kind,
    };
  });
}
export function canSchedule(data: Data, id: string, date: string) {
  const item = data.plan.find((p) => p.id === id);
  if (!item) return false;
  if (!["A", "B", "C"].includes(item.kind)) return true;
  return !data.plan.some(
    (p) =>
      p.id !== id &&
      ["A", "B", "C"].includes(p.kind) &&
      Math.abs(
        (new Date(p.date + "T12:00:00").getTime() -
          new Date(date + "T12:00:00").getTime()) /
          86400000,
      ) < 1.5,
  );
}
export function canProgress(d: Data) {
  const last = d.sessions.slice(-2);
  return (
    last.length === 2 &&
    last.every(
      (s) =>
        !s.partial &&
        !s.pain &&
        s.effort !== "Difícil" &&
        s.reps >= d.reps &&
        s.date >= addDays(localDate(), -14),
    ) &&
    d.reps < 12
  );
}
export function finish(
  d: Data,
  effort: z.infer<typeof effortSchema>,
  pain: boolean,
  partial: boolean,
  resistance: string,
  notes: string,
  actualReps?: number,
): Data {
  if (!d.active) return d;
  const a = d.active;
  if (d.sessions.some((s) => s.planId === a.planId))
    return { ...d, active: null };
  return {
    ...d,
    active: null,
    sessions: [
      ...d.sessions,
      {
        id: a.id,
        planId: a.planId,
        date: localDate(),
        kind: a.kind,
        started: a.started,
        ended: Date.now(),
        partial,
        steps: a.index,
        effort,
        pain,
        readiness: a.readiness,
        reps: actualReps ?? (a.easy ? Math.max(3, a.reps - 2) : a.reps),
        resistance,
        notes,
      },
    ],
  };
}
export function parseBackup(text: string) {
  if (text.length > 5_000_000) throw new Error("Arquivo muito grande");
  const raw = JSON.parse(text);
  return dataSchema.parse(raw);
}
