import { readdir, readFile } from "node:fs/promises";
import real from "../src/lib/access-verifier.json" with { type: "json" };
import fixture from "../tests/fixtures/access-verifier.json" with { type: "json" };
const files = (await readdir("dist/assets")).filter((file) =>
  file.endsWith(".js"),
);
const js = (
  await Promise.all(
    files.map((file) => readFile("dist/assets/" + file, "utf8")),
  )
).join("\n");
if (!js.includes(JSON.stringify(real.hash)))
  throw new Error("O build não contém o verificador de produção esperado.");
if (js.includes(JSON.stringify(fixture.hash)))
  throw new Error("O verificador de teste apareceu no build de produção.");
console.log("Verificador de produção confirmado; credencial de teste ausente.");
