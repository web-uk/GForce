import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { startAutomaticUpdates } from "../../src/lib/app-updates";
import { readData } from "../../src/lib/storage";
import { initialData } from "../../src/lib/model";
vi.mock("../../src/lib/storage", () => ({ readData: vi.fn() }));
let doc: EventTarget & { visibilityState: string };
let sw: EventTarget & {
  getRegistration: ReturnType<typeof vi.fn>;
  register: ReturnType<typeof vi.fn>;
};
let registration: { waiting: { postMessage: ReturnType<typeof vi.fn> } | null };
let reload: ReturnType<typeof vi.fn>;
beforeEach(() => {
  doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
  const win = Object.assign(new EventTarget(), { setTimeout, clearTimeout });
  sw = Object.assign(new EventTarget(), {
    getRegistration: vi.fn(),
    register: vi.fn().mockRejectedValue(new Error("offline")),
  });
  registration = {
    waiting: {
      postMessage: vi.fn(() => {
        registration.waiting = null;
        sw.dispatchEvent(new Event("controllerchange"));
      }),
    },
  };
  sw.getRegistration.mockResolvedValue(registration);
  reload = vi.fn();
  vi.stubGlobal("document", doc);
  vi.stubGlobal("window", win);
  vi.stubGlobal("navigator", { serviceWorker: sw });
  vi.stubGlobal("location", { reload });
  vi.mocked(readData).mockResolvedValue(structuredClone(initialData));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
it("ativa versão pronta e recarrega automaticamente sem escrever dados", async () => {
  const worker = registration.waiting!;
  startAutomaticUpdates();
  await vi.waitFor(() => expect(reload).toHaveBeenCalledOnce());
  expect(worker.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  expect(sw.register).not.toHaveBeenCalled();
});
it("preserva sessão ativa e só aplica ao voltar sem sessão", async () => {
  vi.mocked(readData).mockResolvedValue({
    ...initialData,
    active: {},
  } as Awaited<ReturnType<typeof readData>>);
  startAutomaticUpdates();
  await vi.waitFor(() => expect(readData).toHaveBeenCalled());
  expect(reload).not.toHaveBeenCalled();
  // Simula próxima abertura após encerrar a sessão.
  await new Promise((resolve) => setTimeout(resolve, 3100));
  vi.mocked(readData).mockResolvedValue(structuredClone(initialData));
  doc.dispatchEvent(new Event("visibilitychange"));
  await vi.waitFor(() => expect(reload).toHaveBeenCalledOnce());
});
it("não recarrega formulário editado", async () => {
  startAutomaticUpdates();
  doc.dispatchEvent(new Event("input"));
  await vi.waitFor(() => expect(readData).toHaveBeenCalled());
  expect(reload).not.toHaveBeenCalled();
  expect(registration.waiting).not.toBeNull();
});

it("não aplica atualização quando o armazenamento está ilegível", async () => {
  vi.mocked(readData).mockRejectedValue(new Error("storage blocked"));
  startAutomaticUpdates();
  await vi.waitFor(() => expect(readData).toHaveBeenCalled());
  expect(sw.getRegistration).not.toHaveBeenCalled();
  expect(reload).not.toHaveBeenCalled();
});
it("adia a recarga se uma sessão começar durante a ativação e retoma na próxima abertura", async () => {
  const active = { ...initialData, active: {} } as Awaited<
    ReturnType<typeof readData>
  >;
  vi.mocked(readData)
    .mockResolvedValueOnce(structuredClone(initialData))
    .mockResolvedValueOnce(structuredClone(initialData))
    .mockResolvedValue(active);
  startAutomaticUpdates();
  await vi.waitFor(() => expect(readData).toHaveBeenCalledTimes(3));
  expect(reload).not.toHaveBeenCalled();
  vi.mocked(readData).mockResolvedValue(structuredClone(initialData));
  doc.dispatchEvent(new Event("visibilitychange"));
  await vi.waitFor(() => expect(reload).toHaveBeenCalledOnce());
});
