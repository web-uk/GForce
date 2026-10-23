import { describe, expect, it } from "vitest";
import {
  afterSessionMessage,
  messageFor,
  todayMessage,
} from "../../src/content/messages";
import {
  defaultProfile,
  initialData,
  localDate,
  makePlan,
} from "../../src/lib/model";
const morning = new Date(2026, 9, 23, 9, 0);
const data = () => ({
  ...structuredClone(initialData),
  profile: structuredClone(defaultProfile),
  plan: makePlan(localDate(morning)),
});
describe("mensagens de cuidado", () => {
  it("convida a treinar em um dia planejado e oferece alimentação ao meio-dia", () => {
    expect(todayMessage(data(), morning).kind).toBe("training");
    expect(todayMessage(data(), new Date(2026, 9, 23, 12)).kind).toBe("food");
  });
  it("respeita dias de descanso e limitações", () => {
    expect(todayMessage(data(), new Date(2026, 9, 24, 9)).kind).toBe("care");
    const d = data();
    d.profile.pelvic = true;
    expect(todayMessage(d, morning).kind).toBe("care");
  });
  it("celebra partes realizadas sem sugerir compensação e prioriza sintomas", () => {
    expect(afterSessionMessage(true, false)).toContain("Cada parte conta");
    expect(afterSessionMessage(false, false)).toContain("Parabéns");
    expect(afterSessionMessage(false, true)).toContain("procure avaliação");
  });
  it("mantém uma mensagem estável para cada dia e tema", () => {
    expect(messageFor("training", "2026-10-23")).toBe(
      messageFor("training", "2026-10-23"),
    );
    expect(messageFor("food", "2026-10-23")).not.toBe(
      messageFor("care", "2026-10-23"),
    );
  });
});
