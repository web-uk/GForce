import { readData } from "./storage";

// Atualiza só na abertura/retorno ao app, nunca enquanto a pessoa o utiliza.
export function startAutomaticUpdates() {
  if (!("serviceWorker" in navigator)) return;
  let dirty = false;
  let checking = false;
  let activating = false;
  let reloading = false;
  let controllerChanged = false;
  const edited = () => {
    dirty = true;
  };
  document.addEventListener("input", edited, true);
  document.addEventListener("change", edited, true);
  window.addEventListener("gforce-data-saved", () => {
    dirty = false;
  });

  async function safeToReload() {
    if (dirty || document.visibilityState !== "visible") return false;
    try {
      return (
        !(await readData()).active &&
        !dirty &&
        document.visibilityState === "visible"
      );
    } catch {
      // Armazenamento ilegível: conservar a tela e os registros para recuperação.
      return false;
    }
  }
  async function reloadIfSafe() {
    if (!activating || !controllerChanged || reloading) return;
    if ((await safeToReload()) && !reloading) {
      reloading = true;
      location.reload();
    }
  }
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!activating) return;
    controllerChanged = true;
    void reloadIfSafe();
  });
  async function apply(registration: ServiceWorkerRegistration) {
    if (!checking || activating || !registration.waiting) return false;
    if (!(await safeToReload()) || !checking || activating) return false;
    const worker = registration.waiting;
    if (!worker) return false;
    activating = true;
    worker.postMessage({ type: "SKIP_WAITING" });
    return true;
  }
  async function check() {
    if (activating) {
      void reloadIfSafe();
      return;
    }
    if (checking || dirty || document.visibilityState !== "visible") return;
    checking = true;
    // Não bloquear a abertura offline nem recarregar depois que começou o uso.
    const budget = window.setTimeout(() => {
      checking = false;
    }, 3000);
    try {
      if (!(await safeToReload())) return;
      const existing =
        await navigator.serviceWorker.getRegistration("/GForce/");
      if (existing && (await apply(existing))) return;
      const registration = await navigator.serviceWorker.register(
        "/GForce/sw.js",
        { updateViaCache: "none" },
      );
      const installed = () => {
        void apply(registration);
      };
      const watch = () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed") installed();
        });
      };
      registration.addEventListener("updatefound", watch);
      watch();
      await registration.update();
      await apply(registration);
    } catch {
      // Falta de rede não impede o uso do conteúdo já instalado.
    } finally {
      // A instalação pode terminar depois de update() resolver. O limite de
      // três segundos encerra essa janela sem aplicar a versão durante o uso.
      if (activating) window.clearTimeout(budget);
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void check();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) void check();
  });
  void check();
}
