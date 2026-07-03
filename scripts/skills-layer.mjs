#!/usr/bin/env node

import { executePublicCli } from "../public/skills-layer-public.mjs";

const result = await executePublicCli(process.argv.slice(2));

if (result.stdout) {
  process.stdout.write(`${result.stdout}\n`);
}

if (result.stderr) {
  process.stderr.write(`${result.stderr}\n`);
}

process.exitCode = result.exitCode;
