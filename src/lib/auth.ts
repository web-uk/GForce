import { z } from "zod";
import sharedVerifier from "./access-verifier.json";
const key = "gforce-access";
const accessSchema = z.object({ version: z.literal(2), remember: z.boolean() });
const legacySchema = z.object({
  remember: z.boolean(),
  each: z.boolean(),
  salt: z.array(z.number()),
  hash: z.array(z.number()),
  iterations: z.literal(600000),
});
export function access() {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const data: unknown = JSON.parse(raw);
  const current = accessSchema.safeParse(data);
  if (current.success) return current.data;
  const legacy = legacySchema.parse(data);
  const migrated = { version: 2 as const, remember: legacy.remember };
  localStorage.setItem(key, JSON.stringify(migrated));
  return migrated;
}
export async function verify(password: string) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const result = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: new Uint8Array(sharedVerifier.salt),
        iterations: sharedVerifier.iterations,
        hash: "SHA-256",
      },
      keyMaterial,
      256,
    ),
  );
  return (
    result.reduce(
      (difference, value, index) =>
        difference | (value ^ sharedVerifier.hash[index]),
      0,
    ) === 0
  );
}
export async function unlock(password: string) {
  if (!(await verify(password)))
    throw new Error("Senha incorreta. Tente novamente.");
  remember(true);
}
export function remember(value: boolean) {
  localStorage.setItem(key, JSON.stringify({ version: 2, remember: value }));
}
export function removeAccess() {
  localStorage.removeItem(key);
}
