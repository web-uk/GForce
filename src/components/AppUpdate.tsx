export function AppUpdate({
  registration,
  blocked,
}: {
  registration: ServiceWorkerRegistration | null;
  blocked: boolean;
}) {
  if (!registration) return null;
  return (
    <div className="notice stack" role="status">
      <span>Atualização disponível. Seus registros serão preservados.</span>
      <button
        disabled={blocked}
        onClick={() => {
          if (blocked || !registration.waiting) return;
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => location.reload(),
            { once: true },
          );
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }}
      >
        {blocked ? "Conclua o treino para atualizar" : "Atualizar agora"}
      </button>
    </div>
  );
}
