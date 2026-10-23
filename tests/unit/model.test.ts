import { describe, it, expect } from "vitest";
import {
  initialData,
  defaultProfile,
  makePlan,
  canSchedule,
  canProgress,
  finish,
  parseBackup,
  localDate,
  addDays,
  needsReview,
  type Data,
} from "../../src/lib/model";
import { stepsFor, exercises } from "../../src/content/exercises";
const base = (): Data => ({
  ...structuredClone(initialData),
  profile: structuredClone(defaultProfile),
  plan: makePlan("2026-10-23"),
});
describe("programa e datas locais", () => {
  it("gera quatro semanas e dois dias não consecutivos", () => {
    const d = base();
    expect(d.plan).toHaveLength(28);
    expect(d.plan.filter((p) => ["A", "B"].includes(p.kind))).toHaveLength(8);
    expect(canSchedule(d, d.plan[3].id, "2026-10-24")).toBe(false);
    expect(canSchedule(d, d.plan[3].id, "2026-10-25")).toBe(true);
  });
  it("inclui terceiro dia somente opcional", () => {
    expect(
      makePlan("2026-10-23", true).filter((p) => p.kind === "C"),
    ).toHaveLength(4);
  });
  it("não converte datas locais em dias UTC", () => {
    expect(localDate(new Date(2026, 9, 23, 23, 59))).toBe("2026-10-23");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("requer avaliação para cada indicador relevante", () => {
    expect(needsReview(defaultProfile)).toBe(false);
    for (const patch of [
      { pelvic: true },
      { limitations: "Dor no joelho" },
      { age: "Menos de 18" as const },
      { pregnancy: "Gestação" as const },
    ])
      expect(needsReview({ ...defaultProfile, ...patch })).toBe(true);
  });
});
describe("registros e progressão", () => {
  it("finaliza uma vez e preserva parcial", () => {
    const d = base();
    d.active = {
      id: "s1",
      planId: d.plan[0].id,
      kind: "A",
      short: true,
      index: 2,
      remaining: 25,
      deadline: null,
      started: 1,
      readiness: "Disposta",
      reps: 5,
      easy: false,
    };
    const result = finish(d, "Moderado", false, true, "Peso corporal", "");
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].partial).toBe(true);
    expect(
      finish({ ...result, active: d.active }, "Leve", false, false, "", "")
        .sessions,
    ).toHaveLength(1);
  });
  it("exige duas sessões completas toleradas sem dor", () => {
    let d = base();
    expect(canProgress(d)).toBe(false);
    for (let i = 0; i < 2; i++) {
      d.active = {
        id: "s" + i,
        planId: "p" + i,
        kind: "A",
        short: false,
        index: 5,
        remaining: 0,
        deadline: null,
        started: 1,
        readiness: "Disposta",
        reps: 5,
        easy: false,
      };
      d = finish(d, "Moderado", false, false, "", "");
    }
    expect(canProgress(d)).toBe(true);
    d.sessions[1].pain = true;
    expect(canProgress(d)).toBe(false);
    d.sessions[1].pain = false;
    d.sessions[1].effort = "Difícil";
    expect(canProgress(d)).toBe(false);
  });
});
describe("backup", () => {
  it("valida um backup e descarta chaves fora do esquema", () => {
    const d = base();
    expect(
      parseBackup(JSON.stringify({ ...d, password: "não importar" })),
    ).toEqual(d);
  });
  it("rejeita inválido, incompatível, datas inválidas e duplicação", () => {
    for (const value of [
      "{}",
      "<script/>",
      JSON.stringify({ ...base(), version: 99 }),
      JSON.stringify({
        ...base(),
        plan: [{ ...base().plan[0], date: "2026-02-31" }],
      }),
      JSON.stringify({ ...base(), plan: [base().plan[0], base().plan[0]] }),
    ])
      expect(() => parseBackup(value)).toThrow();
  });
});
describe("coerência das sessões", () => {
  it("cada etapa tem duração e exercícios verificáveis", () => {
    for (const kind of ["A", "B", "C"])
      for (const short of [true, false]) {
        const steps = stepsFor(kind, short, 5, false);
        const duration = steps.reduce((n, s) => n + s.seconds, 0);
        expect(duration).toBeGreaterThanOrEqual(short ? 300 : 600);
        expect(duration).toBeLessThanOrEqual(short ? 480 : 1200);
        for (const s of steps)
          if (s.exercise)
            expect(
              exercises.some(
                (e) => e.id === s.exercise && e.source.startsWith("https://"),
              ),
            ).toBe(true);
      }
  });
});
