import { beforeEach, describe, expect, it, vi } from "vitest";
import { access, remember, verify } from "../../src/lib/auth";
describe("controle compartilhado", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
  });
  it("migra preferência antiga de lembrar sem reexigir senha ou alterar registros", () => {
    localStorage.setItem(
      "gforce-access",
      JSON.stringify({
        salt: [1],
        hash: [1],
        iterations: 600000,
        remember: true,
        each: true,
      }),
    );
    expect(access()).toEqual({ version: 2, remember: true });
    expect(
      JSON.parse(localStorage.getItem("gforce-access")!),
    ).not.toHaveProperty("hash");
  });
  it("lembra a escolha e respeita bloqueio manual", () => {
    expect(access()).toBeNull();
    remember(true);
    expect(access()?.remember).toBe(true);
    remember(false);
    expect(access()?.remember).toBe(false);
  });
  it("rejeita senha incorreta sem registrar a senha em armazenamento", async () => {
    expect(await verify("senha-incorreta-de-teste")).toBe(false);
    expect(access()).toBeNull();
  });
});
