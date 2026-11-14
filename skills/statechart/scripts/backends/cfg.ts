import { CHART_STATES, type ConfigSection, RERUN_STATES, type Spec } from "../ir.ts";

export function configText(sections: ConfigSection[], extra: string[]) {
  const lines: string[] = [];
  for (const s of sections) lines.push(`${s.key} ${s.tokens.join(" ")}`);
  lines.push(...extra);
  return lines.join("\n");
}

export const chartNames = (tag: string, used: ReadonlySet<string> = new Set()) => {
  const suffix = tag.replaceAll("-", "_");
  const unique = (name: string) => (used.has(name) ? `${name}_${suffix}` : name);
  return {
    run: unique("ChartRun"),
    bound: unique("ChartBound"),
    tlc: unique("ChartTLC"),
    naturals: unique("ChartNaturals"),
    budget: unique("ChartBudget"),
    broken: unique("ChartBroken"),
    mark: unique("ChartMark"),
  };
};

export const boundRun = (module: string, names: ReturnType<typeof chartNames>) =>
  [
    `---- MODULE ${names.bound} ----`,
    `EXTENDS ${module}`,
    `${names.tlc} == INSTANCE TLC`,
    `${names.naturals} == INSTANCE Naturals`,
    `${names.bound} == ${names.naturals}!<(${names.tlc}!TLCGet("distinct"), ${RERUN_STATES})`,
    `====`,
  ].join("\n");

export function chartRun(
  { module, variables, invariants }: Spec,
  tag: string,
  names: ReturnType<typeof chartNames> = chartNames(tag),
) {
  const every: string[] = [];
  for (const name of invariants) every.push(`(IF ~${name} THEN {"${name}"} ELSE {}) \\cup `);
  return [
    `---- MODULE ${names.run} ----`,
    `EXTENDS ${module}`,
    `${names.tlc} == INSTANCE TLC`,
    `${names.naturals} == INSTANCE Naturals`,
    `${names.budget} == ${names.naturals}!<=(${names.tlc}!TLCGet("distinct"), ${CHART_STATES})`,
    `${names.broken} == ${every.join("")}{}`,
    `${names.mark} == ${names.broken} = {} \\/ ${names.tlc}!PrintT(<<"${tag}", <<${variables.join(", ")}>>, ${names.broken}>>)`,
    `====`,
  ].join("\n");
}
