#!/usr/bin/env node

import { createCliProgress, createRevealSkipController, executePublicCli, prepareCliPresentation, writeCliResult } from "../public/skills-layer-public.mjs";

const args = process.argv.slice(2);
const capabilities = {
  stdinIsTty: Boolean(process.stdin.isTTY),
  stdoutIsTty: Boolean(process.stdout.isTTY),
  stderrIsTty: Boolean(process.stderr.isTTY)
};
let presentation;
try {
  presentation = prepareCliPresentation(args, process.env, capabilities);
} catch {
  const outputFormatIndex = args.indexOf("--output-format");
  const inlineOutputFormat = args.find((argument) => argument.startsWith("--output-format="))?.slice("--output-format=".length);
  const requestedOutputFormat = outputFormatIndex >= 0 ? args[outputFormatIndex + 1] : inlineOutputFormat;
  const kind = requestedOutputFormat === "stream-json" ? "json-stream" : args.includes("--json") || requestedOutputFormat === "json" ? "json-static" : "human-static";
  presentation = { args, mode: { kind, color: false, motion: false, interactive: false, unicode: true, screenReader: false, classic: true, detail: "standard" } };
}
const human = presentation.mode.kind === "human-interactive" || presentation.mode.kind === "human-static";
const commandName = presentation.args?.find((argument) => !argument.startsWith("-")) ?? "skills-layer";
const lightweight = args.length === 0 || args.includes("--help") || args.includes("-h") || args.includes("--version") || args.includes("-v") || commandName === "help" || commandName === "version";
const progress = lightweight
  ? { info() {}, pause() {}, resume() {}, finish() {} }
  : createCliProgress({ mode: presentation.mode, commandName, stream: process.stderr });
if (human && !lightweight) {
  progress.info(`Running ${commandName}…`);
}
const result = await executePublicCli(args, {
  stdinIsTty: capabilities.stdinIsTty,
  stdoutIsTty: capabilities.stdoutIsTty,
  stderrIsTty: capabilities.stderrIsTty,
  ...(presentation.mode.kind === "json-stream" ? {
    emitCliEvent: (event) => process.stdout.write(`${JSON.stringify(event)}\n`)
  } : {}),
  ...(human ? { emitInfo: progress.info } : {}),
  ...(human ? { onPromptStart: progress.pause, onPromptEnd: progress.resume } : {})
});
progress.finish(result);

const revealSkip = createRevealSkipController(process.stdin);
try {
  await writeCliResult(result, {
    mode: presentation.mode,
    writeStdout: (value) => process.stdout.write(value),
    writeStderr: (value) => process.stderr.write(value),
    sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
    shouldSkip: revealSkip.shouldSkip,
    width: process.stdout.columns
  });
} finally {
  revealSkip.dispose();
}

process.exitCode = result.exitCode;
