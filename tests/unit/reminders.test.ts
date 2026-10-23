import { describe, expect, it, vi } from "vitest";
import {
  buildPushPayload,
  dueReminder,
  sendReminder,
} from "../../scripts/send-reminders.mjs";
describe("envio Web Push", () => {
  it("usa o fuso configurado e não acumula horários passados", () => {
    expect(
      dueReminder(new Date("2026-10-23T12:17:00Z"), "America/Sao_Paulo"),
    ).toMatchObject({ kind: "training", date: "2026-10-23" });
    expect(
      dueReminder(new Date("2026-10-23T13:17:00Z"), "America/Sao_Paulo"),
    ).toBeNull();
    expect(
      dueReminder(new Date("2026-10-24T01:17:00Z"), "America/Sao_Paulo"),
    ).toBeNull();
  });
  it("evita repetição no mesmo dia e envia só a quem autorizou aquele tema", () => {
    const reminder = { kind: "food", date: "2026-10-23", route: "alimentacao" };
    const first = buildPushPayload("app-id", reminder);
    expect(first.idempotency_key).toBe(
      buildPushPayload("app-id", reminder).idempotency_key,
    );
    expect(first.filters).toContainEqual({
      field: "tag",
      key: "gforce_enabled",
      relation: "=",
      value: "true",
    });
    expect(first.filters).toContainEqual({
      field: "tag",
      key: "gforce_food",
      relation: "=",
      value: "true",
    });
    expect(JSON.stringify(first)).not.toMatch(/profile|weight|sessions|health/);
  });
  it("não faz rede sem configuração e reconhece ausência de destinatários", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: "" }) });
    expect(
      await sendReminder({ now: new Date("2026-10-23T12:17:00Z"), fetcher }),
    ).toEqual({ status: "not-configured" });
    expect(fetcher).not.toHaveBeenCalled();
    expect(
      await sendReminder({
        appId: "test",
        apiKey: "dummy-test-key",
        forced: "test",
        fetcher,
      }),
    ).toMatchObject({ status: "no-subscribers" });
    fetcher.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "synthetic-message", errors: [] }),
    });
    expect(
      await sendReminder({
        appId: "test",
        apiKey: "dummy-test-key",
        forced: "test",
        fetcher,
      }),
    ).toMatchObject({ status: "accepted" });
  });
  it("não declara envio quando o provedor recusa", async () => {
    await expect(
      sendReminder({
        appId: "test",
        apiKey: "dummy-test-key",
        forced: "test",
        fetcher: async () => ({ ok: false, status: 403 }),
      }),
    ).rejects.toThrow("HTTP 403");
  });
});
