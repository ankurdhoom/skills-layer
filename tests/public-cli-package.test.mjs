/* node:coverage disable */
import { execFile } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const packageUrl = new URL("../package.json", import.meta.url);
const runtimeUrl = new URL("../public/skills-layer-public.mjs", import.meta.url);
const readmeUrl = new URL("../README.md", import.meta.url);
const licenseUrl = new URL("../LICENSE", import.meta.url);
const wrapperUrl = new URL("../scripts/skills-layer.mjs", import.meta.url);
const securityUrl = new URL("../SECURITY.md", import.meta.url);
const thirdPartyNoticesUrl = new URL("../THIRD_PARTY_NOTICES.md", import.meta.url);
const contributingUrl = new URL("../CONTRIBUTING.md", import.meta.url);
const codeOfConductUrl = new URL("../CODE_OF_CONDUCT.md", import.meta.url);
const dependabotUrl = new URL("../.github/dependabot.yml", import.meta.url);
const ciWorkflowUrl = new URL("../.github/workflows/ci.yml", import.meta.url);
const trustedPublishWorkflowUrl = new URL("../.github/workflows/publish.yml", import.meta.url);
const binPath = fileURLToPath(new URL("../bin/skills-layer.js", import.meta.url));

async function loadRuntime() {
  return await import(runtimeUrl.href);
}

async function makeHome() {
  return await mkdtemp(join(tmpdir(), "skills-layer-cli-package-home-"));
}

function packageEnv(home) {
  const env = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    APPDATA: join(home, "AppData", "Roaming"),
    LOCALAPPDATA: join(home, "AppData", "Local"),
    XDG_CONFIG_HOME: join(home, ".config"),
    SKILLS_LAYER_NO_BANNER: "1"
  };
  delete env.SKILLS_LAYER_API_KEY;
  delete env.SKILLS_LAYER_BASE_URL;
  delete env.SKILLS_LAYER_MCP_TOKEN;
  return env;
}

function packageStateDirectory(home) {
  return process.platform === "win32"
    ? join(home, "AppData", "Roaming", "skills-layer")
    : join(home, ".config", "skills-layer");
}

async function runPublic(args, options = {}) {
  const runtime = await loadRuntime();
  return await runtime.executePublicCli(args, {
    env: packageEnv(options.home ?? await makeHome()),
    cwd: options.cwd,
    stdoutIsTty: options.stdoutIsTty ?? false,
    fetch: options.fetch ?? (async () => { throw new Error("Unexpected network call from package contract test."); }),
    ...(options.promptText ? { promptText: options.promptText } : {})
  });
}

async function runBin(args) {
  const home = await makeHome();
  return await new Promise((resolve) => {
    execFile(process.execPath, [binPath, ...args], { env: packageEnv(home) }, (error, stdout, stderr) => {
      resolve({
        exitCode: typeof error?.code === "number" ? error.code : 0,
        stdout,
        stderr
      });
    });
  });
}

function parseJsonOutput(result) {
  assert.equal(result.stderr, "");
  return JSON.parse(result.stdout);
}

function parseJsonError(result) {
  assert.equal(result.stdout, "");
  return JSON.parse(result.stderr);
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

test("public package metadata keeps the npm tree narrow and non-lifecycle", async () => {
  const packageJson = JSON.parse(await readFile(packageUrl, "utf8"));
  assert.equal(packageJson.name, "skills-layer");
  assert.equal(packageJson.private, false);
  assert.equal(packageJson.type, "module");
  assert.equal(packageJson.bin["skills-layer"], "bin/skills-layer.js");
  assert.equal(packageJson.dependencies, undefined);
  assert.equal(packageJson.devDependencies, undefined);
  assert.equal(packageJson.license, "Apache-2.0");
  assert.deepEqual(packageJson.repository, {
    type: "git",
    url: "git+https://github.com/ankurdhoom/skills-layer.git"
  });
  assert.deepEqual(packageJson.bugs, { url: "https://github.com/ankurdhoom/skills-layer/issues" });
  assert.deepEqual(packageJson.files, [
    "SECURITY.md",
    "THIRD_PARTY_NOTICES.md",
    "bin/skills-layer.js",
    "public/skills-layer-public.mjs",
    "scripts/skills-layer.mjs",
    "docs/assets/*.svg"
  ]);
  assert.deepEqual(Object.keys(packageJson.scripts).sort(), ["test", "test:coverage", "typecheck"]);
  const thirdPartyNotices = await readFile(thirdPartyNoticesUrl, "utf8");
  for (const packageName of ["@inquirer/select", "chalk", "ora", "yaml"]) {
    assert.ok(thirdPartyNotices.includes(`## ${packageName} `));
  }
  for (const lifecycleScript of ["preinstall", "install", "postinstall", "prepare", "prepack", "postpack", "prepublishOnly"]) {
    assert.equal(packageJson.scripts[lifecycleScript], undefined);
  }

  const workflow = await readFile(trustedPublishWorkflowUrl, "utf8");
  assert.match(workflow, /name: Publish skills-layer to npm/u);
  assert.match(workflow, /id-token: write/u);
  assert.match(workflow, /npm publish --access public --provenance/u);
  assert.doesNotMatch(workflow, /NPM_TOKEN/u);

  const ciWorkflow = await readFile(ciWorkflowUrl, "utf8");
  assert.match(ciWorkflow, /name: CLI package CI/u);
  assert.match(ciWorkflow, /npm run typecheck/u);
  assert.match(ciWorkflow, /npm run test:coverage/u);
  assert.doesNotMatch(ciWorkflow, /NPM_TOKEN/u);

  const dependabot = await readFile(dependabotUrl, "utf8");
  assert.match(dependabot, /package-ecosystem: npm/u);

  const [security, contributing, codeOfConduct] = await Promise.all([
    readFile(securityUrl, "utf8"),
    readFile(contributingUrl, "utf8"),
    readFile(codeOfConductUrl, "utf8")
  ]);
  assert.match(security, /Please do not open public issues for active vulnerabilities/u);
  assert.match(security, /hello@skills-layer\.com/u);
  assert.match(contributing, /Do not submit backend service code/u);
  assert.match(codeOfConduct, /Expected Behavior/u);
});

test("public package text stays limited to public CLI surface", async () => {
  const [packageText, readme, license, runtime, wrapper] = await Promise.all([
    readFile(packageUrl, "utf8"),
    readFile(readmeUrl, "utf8"),
    readFile(licenseUrl, "utf8"),
    readFile(runtimeUrl, "utf8"),
    readFile(wrapperUrl, "utf8")
  ]);
  const combined = `${packageText}\n${readme}\n${license}\n${runtime}\n${wrapper}`;
  assert.match(combined, /Skills Layer/u);
  assert.match(combined, /skills-layer/u);
  assert.match(readme, /open-source CLI, MCP setup, and local agent integration layer/u);
  assert.match(readme, /hosted backend code, marketplace services, Guardian scoring internals, and service operations remain proprietary/u);
  assert.match(readme, /actions\/workflows\/ci\.yml\/badge\.svg/u);
  assert.match(readme, /https:\/\/unpkg\.com\/skills-layer\/docs\/assets\/skills-layer-logo\.svg/u);
  assert.match(readme, /https:\/\/unpkg\.com\/skills-layer\/docs\/assets\/skills-layer-hero\.svg/u);
  assert.match(readme, /https:\/\/unpkg\.com\/skills-layer\/docs\/assets\/skills-layer-flow\.svg/u);
  assert.match(readme, /https:\/\/unpkg\.com\/skills-layer\/docs\/assets\/skills-layer-marketplace-flow\.svg/u);
  assert.doesNotMatch(readme, /src="docs\/assets\//u);
  for (const forbidden of [
    new RegExp(["", "api", "v1", "admin"].join("/"), "u"),
    new RegExp(["x", "skills", "layer", "admin", "key"].join("-"), "u"),
    new RegExp(["SKILLS", "LAYER", "ADMIN", "API", "KEY"].join("_"), "u"),
    new RegExp(["--", "admin", "api", "key"].join("-"), "u"),
    new RegExp(["github.com", "openai", "openskills"].join("/"), "u")
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test("public bin wrapper and runtime expose deterministic package smoke commands", async () => {
  const packageJson = JSON.parse(await readFile(packageUrl, "utf8"));
  const expectedVersionLine = `skills-layer ${packageJson.version}`;
  const runtime = await loadRuntime();
  const binVersion = await runBin(["--version"]);
  assert.equal(binVersion.exitCode, 0);
  assert.equal(binVersion.stderr, "");
  assert.equal(binVersion.stdout.trim(), expectedVersionLine);

  const earlyJsonFailure = await runBin(["whoami", "--output-format", "json", "--ui", "invalid"]);
  assert.equal(earlyJsonFailure.exitCode, 1);
  assert.equal(earlyJsonFailure.stdout, "");
  assert.equal(JSON.parse(earlyJsonFailure.stderr).reasonCode, "invalid_global_option");

  const version = await runtime.executePublicCli(["--version"]);
  assert.equal(version.exitCode, 0);
  assert.equal(version.stdout.trim(), expectedVersionLine);

  const jsonVersion = await runPublic(["version", "--json"]);
  assert.equal(jsonVersion.exitCode, 0);
  assert.equal(parseJsonOutput(jsonVersion).data.version, packageJson.version);

  const loginHelp = await runtime.executePublicCli(["login", "--help"]);
  assert.equal(loginHelp.exitCode, 0);
  assert.match(loginHelp.stdout, /Skills Layer login help/u);
  assert.match(loginHelp.stdout, /skills-layer mcp setup/u);

  const fullHelp = await runtime.executePublicCli(["help", "full"]);
  assert.equal(fullHelp.exitCode, 0);
  assert.match(fullHelp.stdout, /Start here:/u);
  assert.match(fullHelp.stdout, /skills-layer help full/u);
});

test("public package renders the complete recorded help audit", async () => {
  const runtime = await loadRuntime();
  const home = await makeHome();
  const checks = [
    ["--help"],
    ...runtime.PUBLIC_CLI_HELP_GOAL_ROUTES,
    ...runtime.PUBLIC_CLI_HELP_BRANCH_ROUTES.map((route) => [...route, "--help"])
  ];
  assert.equal(checks.length, runtime.PUBLIC_CLI_HELP_AUDIT_CHECK_COUNT);
  for (const route of checks) {
    const result = await runPublic(route, { home });
    assert.equal(result.exitCode, 0, route.join(" "));
    assert.equal(result.stderr, "", route.join(" "));
    assert.ok(result.stdout.trim().length > 0, route.join(" "));
    assert.doesNotMatch(result.stdout, /(?:ReferenceError|TypeError|SyntaxError|node:internal)/u, route.join(" "));
    if (route.at(-1) === "--help" && route[0] !== "--help") {
      const commandPath = route.slice(0, -1).join(" ");
      if (result.stdout.startsWith("Skills Layer enterprise help\n")) {
        assert.match(result.stdout, /Setup and billing:/u, commandPath);
        assert.match(result.stdout, /People and access:/u, commandPath);
        assert.match(result.stdout, /Workspace administration:/u, commandPath);
        assert.match(result.stdout, /Enterprise skill ownership:/u, commandPath);
      } else {
        assert.match(result.stdout, /Usage:/u, commandPath);
      }
      assert.ok(result.stdout.includes(`skills-layer ${commandPath}`), commandPath);
      assert.doesNotMatch(result.stdout, /Run `skills-layer --help` for public CLI usage\./u, commandPath);
    }
  }
  for (const routeName of runtime.PUBLIC_CLI_HELP_PATH_NAMES) {
    const result = await runPublic([...routeName.split(" "), "--help"], { home });
    assert.equal(result.exitCode, 0, routeName);
    if (result.stdout.startsWith("Skills Layer enterprise help\n")) {
      assert.match(result.stdout, /Setup and billing:/u, routeName);
    } else {
      assert.match(result.stdout, /Usage:/u, routeName);
    }
    assert.ok(result.stdout.startsWith(`Skills Layer ${routeName}`) || result.stdout.includes(`skills-layer ${routeName}`), routeName);
    assert.doesNotMatch(result.stdout, /Run `skills-layer --help` for public CLI usage\.|Run this supported Skills Layer command\./u, routeName);
  }
});

test("public package keeps email login state-neutral, cancellable, and delivery-aware", async () => {
  const email = "continue@example.com";
  const requests = [];
  const sentFetch = async (input, init = {}) => {
    requests.push({ url: String(input), body: init.body ? JSON.parse(String(init.body)) : null });
    return jsonResponse({ status: "verification_sent", email, emailDelivery: "sent" });
  };
  const jsonStart = await runPublic(["login", "--method", "email", "--email", email, "--no-mcp", "--json"], { fetch: sentFetch });
  assert.equal(jsonStart.exitCode, 0);
  const jsonData = parseJsonOutput(jsonStart).data;
  assert.equal(jsonData.status, "verification_sent");
  assert.equal(jsonData.emailDelivery, "sent");
  assert.equal(jsonData.nextAction, "auth.verify");
  assert.equal(jsonData.nextCommand, `skills-layer auth verify --email ${email} --code <code> --json`);
  assert.deepEqual(requests, [{ url: "https://api.skills-layer.com/api/v1/register", body: { email } }]);

  const cancelled = await runPublic(["login", "--method", "email", "--email", email, "--no-mcp"], {
    fetch: sentFetch,
    stdoutIsTty: true,
    promptText: async () => ""
  });
  assert.equal(cancelled.exitCode, 0);
  assert.match(cancelled.stdout, /No code was entered, so nothing[\s\S]*else was changed/u);

  const deferred = await runPublic(["login", "--method", "email", "--email", email, "--no-mcp"], { fetch: sentFetch });
  assert.equal(deferred.exitCode, 0);
  assert.match(deferred.stdout, /auth verify/u);

  const failed = await runPublic(["login", "--method", "email", "--email", email, "--no-mcp"], {
    fetch: async () => jsonResponse({ status: "verification_sent", email, emailDelivery: "failed" })
  });
  assert.equal(failed.exitCode, 1);
  assert.match(failed.stderr, /email code could not be delivered/u);

  const legacy = await runPublic(["login", "--method", "email", "--email", email, "--no-mcp", "--json"], {
    fetch: async () => jsonResponse({ status: "already_registered" })
  });
  assert.equal(legacy.exitCode, 1);
  assert.match(legacy.stderr, /backend did not prepare an email sign-in code/u);
});

test("public runtime persists backend preference without network access", async () => {
  const home = await makeHome();
  const update = await runPublic(["backend", "--base-url", "https://staging.findfigg.co.uk", "--json"], { home });
  assert.equal(update.exitCode, 0);
  assert.equal(parseJsonOutput(update).data.selectedBaseUrl, "https://staging.findfigg.co.uk");

  const preference = JSON.parse(await readFile(join(packageStateDirectory(home), "backend-preference.json"), "utf8"));
  assert.equal(preference.preferredBaseUrl, "https://staging.findfigg.co.uk");

  const status = await runPublic(["backend", "status", "--json"], { home });
  assert.equal(status.exitCode, 0);
  const statusPayload = parseJsonOutput(status);
  assert.equal(statusPayload.data.selectedBaseUrl, "https://staging.findfigg.co.uk");
  assert.equal(statusPayload.data.loggedIn, false);
});

test("public runtime posts buyer eval summary envelopes with reviews", async () => {
  const home = await makeHome();
  const cwd = await mkdtemp(join(tmpdir(), "skills-layer-cli-package-work-"));
  const summaryPath = join(cwd, "buyer-eval-summary.json");
  const artifactDigest = `sha256:${"a".repeat(64)}`;
  await writeFile(summaryPath, JSON.stringify({
    schemaVersion: "skills-layer.eval.summary.v1",
    status: "passed",
    skillSlug: "project-planner",
    version: "1.0.0",
    artifactDigest,
    evalPackDigest: `sha256:${"b".repeat(64)}`,
    generatedAt: "2026-07-03T00:00:00.000Z",
    counts: {
      cases: 1,
      assertions: 2,
      passed: 2,
      failed: 0,
      skipped: 0
    },
    redaction: {
      mode: "content_free",
      rawContentIncluded: false
    }
  }), "utf8");

  const fetch = async (input, init = {}) => {
    const url = String(input);
    if (url === "https://api.skills-layer.local/api/v1/me") {
      assert.equal(init.headers.authorization, "Bearer package-test-key");
      return jsonResponse({
        userId: "user_package",
        email: "package@example.com",
        role: "buyer",
        roles: ["buyer"]
      });
    }
    if (url === "https://api.skills-layer.local/api/v1/capabilities") {
      assert.equal(init.headers.authorization, "Bearer package-test-key");
      return jsonResponse({ edition: "saas", capabilities: ["marketplace"] });
    }
    if (url === "https://api.skills-layer.local/api/v1/me/library/project-planner/review") {
      assert.equal(init.method, "POST");
      assert.equal(init.headers.authorization, "Bearer package-test-key");
      const body = JSON.parse(String(init.body));
      assert.deepEqual(body, {
        rating: 5,
        feedback: "Useful",
        evalSummary: {
          schemaVersion: "skills-layer.eval.summary.v1",
          status: "passed",
          skillSlug: "project-planner",
          version: "1.0.0",
          artifactDigest,
          evalPackDigest: `sha256:${"b".repeat(64)}`,
          generatedAt: "2026-07-03T00:00:00.000Z",
          counts: {
            cases: 1,
            assertions: 2,
            passed: 2,
            failed: 0,
            skipped: 0
          },
          redaction: {
            mode: "content_free",
            rawContentIncluded: false
          }
        }
      });
      return jsonResponse({ status: "reviewed", reviewId: "review_package", buyerEval: { status: "recorded" } });
    }
    throw new Error(`Unexpected package contract request: ${url}`);
  };

  const login = await runPublic(["login", "--api-key", "package-test-key", "--base-url", "https://api.skills-layer.local", "--no-mcp", "--json"], { home, cwd, fetch });
  assert.equal(login.exitCode, 0);
  assert.equal(parseJsonOutput(login).data.email, "package@example.com");

  const review = await runPublic(["add-review", "project-planner", "--rating", "5", "--feedback", "Useful", "--eval-summary", summaryPath, "--json"], { home, cwd, fetch });
  assert.equal(review.exitCode, 0);
  assert.equal(parseJsonOutput(review).data.buyerEval.status, "recorded");
});

test("public runtime fails closed for internal and login-required commands", async () => {
  const admin = await runPublic(["admin", "status", "--json"]);
  assert.equal(admin.exitCode, 1);
  const adminPayload = parseJsonError(admin);
  assert.equal(adminPayload.status, "error");
  assert.match(adminPayload.summary, /does not include internal commands/u);

  const whoami = await runPublic(["whoami", "--json"]);
  assert.equal(whoami.exitCode, 1);
  const whoamiPayload = parseJsonError(whoami);
  assert.equal(whoamiPayload.status, "login_required");
  assert.equal(whoamiPayload.reasonCode, "login_required");
  assert.equal(whoamiPayload.nextAction, "login");
  assert.match(whoamiPayload.nextStep, /skills-layer login/u);
  assert.doesNotMatch(whoamiPayload.summary, /--api-key/u);
});
