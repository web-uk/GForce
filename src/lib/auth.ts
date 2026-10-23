import { z } from "zod";
const key = "gforce-access";
const credential = z.object({
  salt: z.array(z.number()),
  hash: z.array(z.number()),
  iterations: z.literal(600000),
  each: z.boolean(),
  remember: z.boolean(),
});
export function access() {
  const v = localStorage.getItem(key);
  return v ? credential.parse(JSON.parse(v)) : null;
}
async function derive(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return Array.from(
    new Uint8Array(
      await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt as Uint8Array<ArrayBuffer>,
          iterations: 600000,
          hash: "SHA-256",
        },
        material,
        256,
      ),
    ),
  );
}
export async function setPassword(password: string) {
  if (password.length < 8) throw new Error("Use pelo menos 8 caracteres.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const previous = access();
  localStorage.setItem(
    key,
    JSON.stringify({
      salt: Array.from(salt),
      hash: await derive(password, salt),
      iterations: 600000,
      each: previous?.each ?? false,
      remember: true,
    }),
  );
}
export async function verify(password: string) {
  const a = access();
  if (!a) return false;
  const h = await derive(password, new Uint8Array(a.salt));
  return h.reduce((diff, v, i) => diff | (v ^ a.hash[i]), 0) === 0;
}
export function remember(value: boolean) {
  const a = access();
  if (a) localStorage.setItem(key, JSON.stringify({ ...a, remember: value }));
}
export function eachOpening(value: boolean) {
  const a = access();
  if (a) localStorage.setItem(key, JSON.stringify({ ...a, each: value }));
}
export function removeAccess() {
  localStorage.removeItem(key);
}
