import { z } from "zod";
const key = "gforce-notifications";
export const reminderSchema = z.object({
  version: z.literal(1),
  decision: z.enum(["pending", "enabled", "declined"]),
  training: z.boolean(),
  food: z.boolean(),
  care: z.boolean(),
  celebrations: z.boolean(),
});
export type ReminderPreferences = z.infer<typeof reminderSchema>;
export const defaultReminders: ReminderPreferences = {
  version: 1,
  decision: "pending",
  training: true,
  food: true,
  care: true,
  celebrations: true,
};
export const pushAppId = import.meta.env.VITE_ONESIGNAL_APP_ID ?? "";
export const reminderTimeZone =
  import.meta.env.VITE_REMINDER_TIMEZONE || "America/Sao_Paulo";
export function reminderPreferences() {
  const raw = localStorage.getItem(key);
  return raw ? reminderSchema.parse(JSON.parse(raw)) : { ...defaultReminders };
}
export function saveReminderPreferences(prefs: ReminderPreferences) {
  localStorage.setItem(key, JSON.stringify(reminderSchema.parse(prefs)));
}
export function supportsNotifications() {
  return "Notification" in window && "serviceWorker" in navigator;
}
export function permission() {
  return supportsNotifications() ? Notification.permission : "unsupported";
}
export interface OneSignalSDK {
  init(options: Record<string, unknown>): Promise<void>;
  setConsentRequired(value: boolean): void;
  setConsentGiven(value: boolean): void;
  Notifications: { requestPermission(): Promise<void>; permission: boolean };
  User: {
    addTags(tags: Record<string, string>): Promise<void>;
    PushSubscription: {
      id: string | null;
      optedIn: boolean;
      optIn(): Promise<void>;
      optOut(): Promise<void>;
    };
  };
}
declare global {
  interface Window {
    OneSignalDeferred?: Array<(sdk: OneSignalSDK) => void | Promise<void>>;
  }
}
let sdkPromise: Promise<OneSignalSDK> | undefined;
export function preparePushService() {
  if (!pushAppId)
    return Promise.reject(
      new Error(
        "O serviço de lembretes com o app fechado ainda precisa ser configurado.",
      ),
    );
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<OneSignalSDK>((resolve, reject) => {
    const timeout = window.setTimeout(
      () =>
        reject(
          new Error(
            "Não foi possível conectar ao serviço. Confira sua internet e tente novamente.",
          ),
        ),
      15000,
    );
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (sdk) => {
      try {
        sdk.setConsentRequired(true);
        await sdk.init({
          appId: pushAppId,
          serviceWorkerPath: "GForce/push/OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: "/GForce/push/" },
          requiresUserPrivacyConsent: true,
          autoResubscribe: true,
          notifyButton: { enable: false },
          welcomeNotification: { disable: true },
          promptOptions: {
            slidedown: { prompts: [{ type: "push", autoPrompt: false }] },
          },
        });
        sdk.setConsentGiven(true);
        window.clearTimeout(timeout);
        resolve(sdk);
      } catch {
        window.clearTimeout(timeout);
        reject(
          new Error(
            "O serviço não conectou. Confira a configuração e tente novamente nas configurações.",
          ),
        );
      }
    });
    const existing = document.getElementById("gforce-push-sdk");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "gforce-push-sdk";
      script.src =
        "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      script.onerror = () => {
        window.clearTimeout(timeout);
        script.remove();
        reject(
          new Error(
            "Serviço indisponível. Confira sua conexão e tente novamente.",
          ),
        );
      };
      document.head.appendChild(script);
    }
  });
  sdkPromise.catch(() => {
    sdkPromise = undefined;
  });
  return sdkPromise;
}
export async function syncPushPreferences(prefs: ReminderPreferences) {
  const sdk = await preparePushService();
  if (prefs.decision === "enabled") sdk.setConsentGiven(true);
  await sdk.User.addTags({
    gforce_enabled: String(prefs.decision === "enabled"),
    gforce_training: String(prefs.training),
    gforce_food: String(prefs.food),
    gforce_care: String(prefs.care),
  });
  if (prefs.decision !== "enabled") {
    await sdk.User.PushSubscription.optOut();
    sdk.setConsentGiven(false);
    return false;
  }
  if (permission() !== "granted") return false;
  await sdk.User.PushSubscription.optIn();
  return !!sdk.User.PushSubscription.id && sdk.User.PushSubscription.optedIn;
}
export async function localNotification(
  body: string,
  tag = "gforce-care",
  route = "hoje",
  explicitTest = false,
) {
  const prefs = reminderPreferences();
  if (
    prefs.decision !== "enabled" ||
    (!prefs.celebrations && !explicitTest) ||
    permission() !== "granted"
  )
    return false;
  const registration =
    await navigator.serviceWorker.getRegistration("/GForce/");
  if (!registration) return false;
  await registration.showNotification("GForce · um carinho para você", {
    body,
    icon: "/GForce/icon-192.png",
    tag,
    data: { gforceLocal: true, route },
  });
  return true;
}
export async function stopNotifications() {
  const previous = reminderPreferences();
  const prefs = { ...previous, decision: "declined" as const };
  if (
    previous.decision === "enabled" &&
    pushAppId &&
    permission() === "granted"
  )
    await syncPushPreferences(prefs);
  saveReminderPreferences(prefs);
}
export function forgetReminderPreferences() {
  localStorage.removeItem(key);
}
