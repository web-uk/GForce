import { spawnSync } from "node:child_process";

const areas = {
  access: { unit: ["access"], e2e: ["access"] },
  profile: { unit: ["model"], e2e: ["profile"] },
  workout: { unit: ["model"], e2e: ["workout"] },
  calendar: { unit: ["model"], e2e: ["calendar"] },
  progress: { unit: ["model"], e2e: ["progress"] },
  data: { unit: ["model"], e2e: ["data"] },
  library: { unit: [], e2e: ["library"] },
  nutrition: { unit: [], e2e: ["nutrition"] },
  notifications: { unit: ["messages", "reminders"], e2e: ["notifications"] },
  pwa: { unit: [], e2e: ["pwa"] },
  layout: { unit: [], e2e: ["layout"] },
  accessibility: { unit: [], e2e: ["accessibility"] },
};
const selected = process.argv.slice(2);
if (!selected.length || selected.some((name) => !areas[name])) {
  console.error(`Use: npm run test:area -- ${Object.keys(areas).join(" | ")}`);
  process.exit(1);
}
function run(args, env = process.env) {
  const result = spawnSync("npm", args, { stdio: "inherit", env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Falhou: npm ${args.join(" ")}`);
}
const unit = [...new Set(selected.flatMap((name) => areas[name].unit))];
const specs = [...new Set(selected.flatMap((name) => areas[name].e2e))];
let failed = false;
try {
  if (unit.length)
    run(["test", "--", ...unit.map((name) => `tests/unit/${name}.test.ts`)]);
  run(["run", "build"], {
    ...process.env,
    GFORCE_TEST_BUILD: "1",
    VITE_ONESIGNAL_APP_ID: "00000000-0000-4000-8000-000000000001",
  });
  run([
    "run",
    "test:e2e",
    "--",
    ...specs.map((name) => `tests/e2e/${name}.spec.ts`),
  ]);
} catch (error) {
  console.error(error.message);
  failed = true;
} finally {
  // Nunca deixar a credencial fictícia como último build disponível para publicação.
  try {
    run(["run", "build"], { ...process.env, GFORCE_TEST_BUILD: "0" });
    const check = spawnSync(
      process.execPath,
      ["scripts/check-production-verifier.mjs"],
      { stdio: "inherit" },
    );
    if (check.error || check.status !== 0) failed = true;
  } catch (error) {
    console.error(error.message);
    failed = true;
  }
}
process.exitCode = failed ? 1 : 0;
