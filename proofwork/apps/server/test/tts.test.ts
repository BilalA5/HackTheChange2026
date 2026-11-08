// Natural speech: voice choice, the engine chain with cache and cooldowns, the Gemini TTS request, the /api/tts
// route, the degraded status of the live engine, and the practice coach's variety.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ChatMessage, User } from "@pw/shared";
import { buildServer } from "../src/app.ts";
import { createTtsService, enginesFromEnv, NoVoiceError, normaliseSpeech } from "../src/ai/tts/index.ts";
import { GeminiTtsEngine, pcm16ToWav, type TtsEngine } from "../src/ai/tts/engines.ts";
import { GEMINI_VOICES, KOKORO_VOICES, styleFor, voiceFor } from "../src/ai/tts/voices.ts";
import { GeminiClient } from "../src/ai/providers/gemini.ts";
import { createLiveEngine, LIVE_COOLDOWN_MS } from "../src/ai/live/index.ts";
import { coachReplyMock } from "../src/ai/mock/writing.ts";
import type { LlmClient } from "../src/ai/llm.ts";
import type { CoachContext } from "../src/contracts.ts";
import { createStubAi } from "./stubAi.ts";
import { FIXTURE_CONTENT } from "./fixtures.ts";

const tmp = () => mkdtempSync(join(tmpdir(), "pw-tts-"));
const WAV = (label: string) => pcm16ToWav(Buffer.from(label.padEnd(8, "-")), 24000);

function fakeEngine(name: "gemini" | "kokoro", behave: (text: string) => Buffer | Error) {
  const calls: { text: string; voice: string }[] = [];
  const engine: TtsEngine = {
    name,
    async synthesize(text, voice) {
      calls.push({ text, voice });
      const out = behave(text);
      if (out instanceof Error) throw out;
      return out;
    },
  };
  return { engine, calls };
}

const httpError = (status: number) => Object.assign(new Error(`status ${status}`), { status });

test("voices: a speaker keeps one voice, styles pick the family, system names map to a style", () => {
  const a = voiceFor("kokoro", { style: "feminine" }, "npc-ada");
  assert.equal(voiceFor("kokoro", { style: "feminine" }, "npc-ada"), a, "stable for the same speaker");
  assert.ok(KOKORO_VOICES.feminine.includes(a));
  assert.ok(KOKORO_VOICES.masculine.includes(voiceFor("kokoro", { style: "masculine" }, "npc-ada")));
  assert.ok(GEMINI_VOICES.masculine.includes(voiceFor("gemini", { style: "masculine" }, "npc-tom")));
  assert.equal(styleFor({ voiceName: "Samantha" }, "x"), "feminine");
  assert.equal(styleFor({ voiceName: "Daniel" }, "x"), "masculine");
  assert.equal(styleFor(undefined, "same-seed"), styleFor(undefined, "same-seed"));
});

test("wav: 44-byte PCM header with the right sizes and rate", () => {
  const wav = pcm16ToWav(Buffer.alloc(480), 24000);
  assert.equal(wav.length, 524);
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.toString("ascii", 8, 12), "WAVE");
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt16LE(34), 16);
  assert.equal(wav.readUInt32LE(40), 480);
});

test("tts service: first engine wins, clips are cached, whitespace does not change the cache key", async () => {
  const dir = tmp();
  try {
    const g = fakeEngine("gemini", (t) => WAV(`g:${t}`));
    const k = fakeEngine("kokoro", (t) => WAV(`k:${t}`));
    const tts = createTtsService({ engines: [g.engine, k.engine], cacheDir: dir });
    assert.deepEqual(tts.engines(), ["gemini", "kokoro"]);

    const first = await tts.speak({ text: "Hello  there.", voice: { style: "feminine" }, speaker: "npc-1" });
    assert.equal(first.engine, "gemini");
    assert.equal(first.cached, false);
    assert.ok(GEMINI_VOICES.feminine.includes(first.voice));

    const again = await tts.speak({ text: " Hello there. ", voice: { style: "feminine" }, speaker: "npc-1" });
    assert.equal(again.cached, true);
    assert.deepEqual(again.wav, first.wav);
    assert.equal(g.calls.length, 1, "the second request came from the cache");
    assert.equal(k.calls.length, 0);
    assert.equal(readdirSync(dir).filter((f) => f.endsWith(".wav")).length, 1);
    assert.equal(normaliseSpeech("  a \n b  "), "a b");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("tts service: a billing error falls back to the next engine and skips the failed one for a while", async () => {
  const dir = tmp();
  let clock = 1_000_000;
  try {
    const g = fakeEngine("gemini", () => httpError(402));
    const k = fakeEngine("kokoro", (t) => WAV(`k:${t}`));
    const tts = createTtsService({ engines: [g.engine, k.engine], cacheDir: dir, now: () => clock });

    const one = await tts.speak({ text: "Line one.", speaker: "npc-2" });
    assert.equal(one.engine, "kokoro");
    const two = await tts.speak({ text: "Line two.", speaker: "npc-2" });
    assert.equal(two.engine, "kokoro");
    assert.equal(g.calls.length, 1, "gemini is not retried during its cooldown");

    clock += 11 * 60_000;
    await tts.speak({ text: "Line three.", speaker: "npc-2" });
    assert.equal(g.calls.length, 2, "gemini is tried again after the cooldown");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("tts service: no engine, or every engine failing, raises NoVoiceError", async () => {
  const dir = tmp();
  try {
    await assert.rejects(createTtsService({ engines: [], cacheDir: dir }).speak({ text: "Hi." }), NoVoiceError);
    const bad = fakeEngine("kokoro", () => new Error("model missing"));
    await assert.rejects(createTtsService({ engines: [bad.engine], cacheDir: dir }).speak({ text: "Hi." }), NoVoiceError);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("tts engines from env: auto puts Gemini before Kokoro, practice mode and off drop Gemini", () => {
  const names = (env: NodeJS.ProcessEnv) => enginesFromEnv("/tmp/pw", env).map((e) => e.name);
  assert.deepEqual(names({ GEMINI_API_KEY: "k" }), ["gemini", "kokoro"]);
  assert.deepEqual(names({}), ["kokoro"]);
  assert.deepEqual(names({ GEMINI_API_KEY: "k", PW_AI_PROVIDER: "practice" }), ["kokoro"]);
  assert.deepEqual(names({ GEMINI_API_KEY: "k", PW_TTS_PROVIDER: "kokoro" }), ["kokoro"]);
  assert.deepEqual(names({ GEMINI_API_KEY: "k", PW_TTS_PROVIDER: "off" }), []);
});

test("gemini tts: sends an AUDIO request with the voice, in the header-only key style, and wraps PCM as WAV", async () => {
  const seen: { url: string; init: RequestInit }[] = [];
  const pcm = Buffer.alloc(960, 7);
  const fakeFetch = (async (url: string, init: RequestInit) => {
    seen.push({ url, init });
    return new Response(
      JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: "audio/L16;codec=pcm;rate=24000", data: pcm.toString("base64") } }] } }] }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as unknown as typeof fetch;
  const client = new GeminiClient({ apiKey: "test-key-123", models: { quality: "q", fast: "f" }, fetch: fakeFetch });
  const wav = await new GeminiTtsEngine(client, "gemini-3.8-flash-tts").synthesize("Hello.", "Kore");

  assert.equal(seen.length, 1);
  assert.match(seen[0].url, /gemini-3\.8-flash-tts:generateContent$/);
  assert.ok(!seen[0].url.includes("test-key-123"), "the key never goes in the URL");
  assert.equal((seen[0].init.headers as Record<string, string>)["x-goog-api-key"], "test-key-123");
  const body = JSON.parse(String(seen[0].init.body));
  assert.deepEqual(body.generationConfig.responseModalities, ["AUDIO"]);
  assert.equal(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, "Kore");
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.deepEqual(wav.subarray(44), pcm);
});

test("POST /api/tts returns audio/wav with the engine header, 503 without a voice, 400 for long text, 401 without auth", async () => {
  const dir = tmp();
  const k = fakeEngine("kokoro", (t) => WAV(`k:${t}`));
  const app = await buildServer({
    dbPath: join(dir, "test.db"),
    dataDir: dir,
    ai: createStubAi().ai,
    tts: createTtsService({ engines: [k.engine], cacheDir: join(dir, "tts") }),
    content: FIXTURE_CONTENT,
    logger: false,
  });
  try {
    const login = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email: "voice@example.com", name: "Vee" } });
    const token = (JSON.parse(login.body) as { token: string }).token;
    const auth = { authorization: `Bearer ${token}` };

    const ok = await app.inject({ method: "POST", url: "/api/tts", headers: auth, payload: { text: "Welcome aboard.", voice: { style: "masculine" }, speaker: "npc-test" } });
    assert.equal(ok.statusCode, 200);
    assert.equal(ok.headers["content-type"], "audio/wav");
    assert.equal(ok.headers["x-tts-engine"], "kokoro");
    assert.equal(ok.rawPayload.toString("ascii", 0, 4), "RIFF");
    assert.ok(KOKORO_VOICES.masculine.includes(k.calls[0].voice));

    const long = await app.inject({ method: "POST", url: "/api/tts", headers: auth, payload: { text: "x".repeat(601) } });
    assert.equal(long.statusCode, 400);
    const anon = await app.inject({ method: "POST", url: "/api/tts", payload: { text: "Hi." } });
    assert.equal(anon.statusCode, 401);

    const health = JSON.parse((await app.inject({ method: "GET", url: "/api/health" })).body) as { tts: { engines: string[] }; degraded: unknown };
    assert.deepEqual(health.tts.engines, ["kokoro"]);
    assert.equal(health.degraded, null);
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }

  const dir2 = tmp();
  const silent = await buildServer({
    dbPath: join(dir2, "test.db"),
    dataDir: dir2,
    ai: createStubAi().ai,
    tts: createTtsService({ engines: [], cacheDir: join(dir2, "tts") }),
    content: FIXTURE_CONTENT,
    logger: false,
  });
  try {
    const login = await silent.inject({ method: "POST", url: "/api/auth/login", payload: { email: "quiet@example.com", name: "Q" } });
    const token = (JSON.parse(login.body) as { token: string }).token;
    const res = await silent.inject({ method: "POST", url: "/api/tts", headers: { authorization: `Bearer ${token}` }, payload: { text: "Hi." } });
    assert.equal(res.statusCode, 503);
  } finally {
    await silent.close();
    rmSync(dir2, { recursive: true, force: true });
  }
});

test("live engine: a 402 marks the AI as degraded, skips live calls during the cooldown, and recovers", async () => {
  let clock = 5_000_000;
  let calls = 0;
  let failing = true;
  const llm: LlmClient = {
    provider: "gemini",
    models: { quality: "q", fast: "f" },
    complete: async () => {
      calls++;
      if (failing) throw httpError(402);
      return "Live coach reply.";
    },
    json: async () => {
      throw new Error("unused");
    },
    stream: async () => {
      throw new Error("unused");
    },
  };
  const engine = createLiveEngine(llm, { now: () => clock });
  const user = { id: "u", name: "Sam Lee", email: "s@example.com", vision: null } as unknown as User;
  const ask = () => engine.coachReply({ user, history: [], message: "hi", progressSummary: "" });

  assert.equal(engine.status(), null);
  const fallback = await ask();
  assert.match(fallback, /Sam/);
  assert.equal(engine.status()?.reason, "billing");
  await ask();
  assert.equal(calls, 1, "no live call while the provider is known to be out of credits");

  failing = false;
  clock += LIVE_COOLDOWN_MS + 1;
  assert.equal(await ask(), "Live coach reply.");
  assert.equal(engine.status(), null, "a successful call clears the degraded status");
});

test("practice coach: varies its answer, never repeats the last reply, and uses the current project", () => {
  const user = { id: "u", name: "Maya Chen", email: "m@example.com", vision: { targetRole: "Registered Nurse" } } as unknown as User;
  const context: CoachContext = {
    careerTitle: "Pediatric Registered Nurse",
    project: { title: "Pediatric Triage Audit", company: "Bow Valley Children's", manager: "Clara Lindqvist" },
    nextStep: "finish the kickoff meeting with Clara Lindqvist",
    completedProjects: 0,
    totalProjects: 3,
    level: 0,
    xp: 0,
    streak: 1,
  };
  const history: ChatMessage[] = [];
  const replies: string[] = [];
  for (let n = 0; n < 4; n++) {
    const text = coachReplyMock({ user, history, message: "hi", progressSummary: "", context });
    replies.push(text);
    history.push({ id: `l${n}`, role: "learner", text: "hi", at: "" }, { id: `c${n}`, role: "npc", text, at: "" });
  }
  assert.equal(new Set(replies.slice(0, 3)).size, 3, "three greetings in a row are all different");
  assert.notEqual(replies[3], replies[2]);
  assert.match(replies.join(" "), /Pediatric Triage Audit|finish the kickoff meeting/);

  const week = coachReplyMock({ user, history: [], message: "What should I focus on this week?", progressSummary: "", context });
  assert.match(week, /finish the kickoff meeting with Clara Lindqvist/);
  const interview = coachReplyMock({ user, history: [], message: "How do I prepare for interviews?", progressSummary: "", context });
  assert.match(interview, /pediatric registered nurse|Pediatric Triage Audit/i);
});
