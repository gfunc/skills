import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HARNESS = "pi";
const PACK_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROFILE = resolve(PACK_ROOT, "references/harnesses/pi.md");
const TEMPLATE = resolve(PACK_ROOT, "references/adapters/pointer.txt");

function pointer() {
  let line = "";
  try {
    line = readFileSync(TEMPLATE, "utf8");
  } catch {
    line = "";
  }
  if (!line) {
    line = `harness=${HARNESS}\nprofile-root=${PACK_ROOT}\nprofile=${PROFILE}\nRead the named profile before harness-dependent work.`;
  }
  line = line
    .replaceAll("{{HARNESS}}", HARNESS)
    .replaceAll("{{PROFILE_ROOT}}", PACK_ROOT)
    .replaceAll("{{PROFILE}}", PROFILE);
  if (!existsSync(PROFILE)) {
    line += `\n\nHARNESS CONTRACT UNAVAILABLE: ${PROFILE} is missing or unreadable. Stop harness-dependent actions until the profile is restored.`;
  }
  return line;
}

export default function harnessContract(pi) {
  pi.on("before_agent_start", (event) => {
    const options = event && event.systemPromptOptions;
    if (!options || !options.sections) return;
    options.sections.harness_contract = pointer();
  });
}
