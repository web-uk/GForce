import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import catalogue from "../src/content/reminders.json" with { type: "json" };

const slots = [
  { hour: 9, kind: "training", route: "hoje" },
  { hour: 13, kind: "food", route: "alimentacao" },
  { hour: 18, kind: "care", route: "hoje" },
];
export function localParts(now, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type).value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
  };
}
export function dueReminder(now, timeZone, forced) {
  const { date, hour } = localParts(now, timeZone);
  if (forced && !["training", "food", "care", "test"].includes(forced))
    throw new Error("Tipo de lembrete inválido.");
  const slot = forced
    ? forced === "test"
      ? { kind: "test", route: "hoje" }
      : slots.find((slot) => slot.kind === forced)
    : slots.find((slot) => slot.hour === hour);
  return slot ? { ...slot, date } : null;
}
export function buildPushPayload(appId, reminder, runId = "") {
  const seed = `${appId}:${reminder.date}:${reminder.kind}:${reminder.kind === "test" ? runId : ""}`;
  const hex = createHash("sha256")
    .update(seed)
    .digest("hex")
    .slice(0, 32)
    .split("");
  hex[12] = "4";
  hex[16] = "a";
  const id = hex.join("");
  const key = `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
  const messages = catalogue[reminder.kind];
  const text = messages
    ? messages[
        [...reminder.date].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
          messages.length
      ]
    : "Um lembrete de cuidado passando por aqui. Que seu dia tenha espaço para você! 💗";
  const body =
    reminder.kind === "training"
      ? "Se hoje for dia de treino e você ainda não treinou, aqui vai um convite: " +
        text
      : text;
  const filters = [
    { field: "tag", key: "gforce_enabled", relation: "=", value: "true" },
  ];
  if (reminder.kind !== "test")
    filters.push({
      field: "tag",
      key: `gforce_${reminder.kind}`,
      relation: "=",
      value: "true",
    });
  return {
    app_id: appId,
    target_channel: "push",
    isAnyWeb: true,
    filters,
    headings: { en: "GForce · no seu ritmo", pt: "GForce · no seu ritmo" },
    contents: { en: body, pt: body },
    web_url: `https://web-uk.github.io/GForce/#/${reminder.route}`,
    chrome_web_icon: "https://web-uk.github.io/GForce/icon-192.png",
    ttl: 3600,
    idempotency_key: key,
  };
}
export async function sendReminder({
  appId,
  apiKey,
  timeZone = "America/Sao_Paulo",
  now = new Date(),
  forced,
  runId,
  fetcher = fetch,
}) {
  const reminder = dueReminder(now, timeZone, forced);
  if (!reminder) return { status: "not-due" };
  if (!appId || !apiKey) return { status: "not-configured" };
  const payload = buildPushPayload(appId, reminder, runId);
  const response = await fetcher(
    "https://api.onesignal.com/notifications?c=push",
    {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!response.ok)
    throw new Error(
      `O serviço de notificações recusou o envio (HTTP ${response.status}). Confira a configuração no GitHub e no OneSignal.`,
    );
  const result = await response.json();
  if (result.errors && Object.keys(result.errors).length && result.id)
    throw new Error(
      "O serviço retornou erro parcial. Confira a inscrição do aparelho.",
    );
  return {
    status: result.id ? "accepted" : "no-subscribers",
    kind: reminder.kind,
    date: reminder.date,
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const result = await sendReminder({
      appId: process.env.ONESIGNAL_APP_ID,
      apiKey: process.env.ONESIGNAL_REST_API_KEY,
      timeZone: process.env.GFORCE_REMINDER_TIMEZONE || "America/Sao_Paulo",
      forced: process.env.GFORCE_FORCE_KIND || undefined,
      runId: process.env.GITHUB_RUN_ID,
    });
    console.log(JSON.stringify(result));
    if (result.status === "not-configured")
      console.log(
        "Configuração externa pendente; nenhuma notificação foi enviada.",
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
