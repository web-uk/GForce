import catalogue from "./reminders.json";
import type { Data } from "../lib/model";
import { localDate, needsReview } from "../lib/model";

export const invitations = catalogue.training;
export const foodMessages = catalogue.food;
export const recoveryMessages = catalogue.care;
function pick(items: readonly string[], date: string) {
  const index = [...date].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return items[index % items.length];
}
export type MessageKind = "training" | "food" | "care";
export function messageFor(kind: MessageKind, date = localDate()) {
  return pick(
    kind === "food"
      ? foodMessages
      : kind === "training"
        ? invitations
        : recoveryMessages,
    date,
  );
}
export function todayMessage(data: Data, now = new Date()) {
  const date = localDate(now);
  const activity = data.plan.find((item) => item.date === date);
  const didTrain = data.sessions.some((session) => session.date === date);
  const needsCare =
    !data.profile ||
    needsReview(data.profile) ||
    !!data.sessions.at(-1)?.pain ||
    !data.profile.equipment.includes("Cadeira") ||
    !data.profile.equipment.includes("Parede");
  const kind: MessageKind =
    now.getHours() >= 11 && now.getHours() < 15
      ? "food"
      : didTrain ||
          needsCare ||
          !activity ||
          !["A", "B", "C"].includes(activity.kind)
        ? "care"
        : "training";
  return {
    kind,
    title:
      kind === "food"
        ? "Uma pausa para se nutrir"
        : kind === "training"
          ? "Um convite para cuidar de você"
          : "Cuidado também é recuperar",
    text: messageFor(kind, date),
  };
}
export function afterSessionMessage(partial: boolean, pain: boolean) {
  if (pain)
    return "Obrigada por registrar como você se sentiu. Seu cuidado vem primeiro: interrompa os exercícios e procure avaliação antes de retomar. 💗";
  return partial
    ? "Você reservou um momento para cuidar de você. Cada parte conta! Descanse e volte no seu ritmo, sem compensar o que ficou para depois. 🌷"
    : "Parabéns por dedicar esse tempo a você! Agora é hora de recuperar as energias. A próxima sessão espera pelo seu ritmo — um passo de cada vez. 💗";
}
