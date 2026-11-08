// Gemini client tests with a mocked global fetch. Nothing here touches the network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createAiEngine, resolveModels, resolveProvider } from "../src/ai/index.ts";
import { GeminiClient, geminiSchema } from "../src/ai/providers/gemini.ts";
import type { LlmClient } from "../src/ai/llm.ts";

const KEY = "fake-gemini-key-123456789";
const MODELS = { quality: "gemini-3.8-flash", fast: "gemini-3.5-flash-lite" };

interface Call {
  url: string;
  init: RequestInit;
  body: Record<string, any>;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function candidate(text: string, finishReason = "STOP") {
  return { candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } };
}

/** SSE body split into small chunks, so the client's line buffering is exercised. */
function sseResponse(events: unknown[], chunkSize = 7): Response {
  const bytes = new TextEncoder().encode(events.map((e) => `data: ${JSON.stringify(e)}\r\n\r\n`).join(""));
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < bytes.length; i += chunkSize) controller.enqueue(bytes.slice(i, i + chunkSize));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { "content-type": "text/event-stream" } });
}

function fakeFetch(responses: (() => Response | Promise<Response>)[]) {
  const calls: Call[] = [];
  const fn = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {}, body: JSON.parse(String(init?.body ?? "{}")) });
    const next = responses[Math.min(calls.length - 1, responses.length - 1)];
    return next();
  };
  return { calls, fn: fn as unknown as typeof fetch };
}

function client(fn: typeof fetch, extra: Partial<ConstructorParameters<typeof GeminiClient>[0]> = {}): GeminiClient {
  return new GeminiClient({ apiKey: KEY, models: MODELS, fetch: fn, retryDelayMs: 0, ...extra });
}

test("request shape: endpoint, key in the header, system instruction, roles, inline images, stripped schema", async () => {
  const f = fakeFetch([() => jsonResponse(candidate('{"title":"Routing"}'))]);
  const gemini = client(f.fn);
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      tags: { type: "array", items: { type: "object", additionalProperties: false, properties: { n: { type: "string" } } } },
    },
    required: ["title"],
  };
  const out = await gemini.json({
    tier: "fast",
    system: "Be terse.",
    content: [
      { type: "text", text: "Describe the screen." },
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: "AAAA" } },
    ],
    schema,
    validate: (v) => v as { title: string },
  });
  assert.deepEqual(out, { title: "Routing" });

  const call = f.calls[0];
  assert.equal(call.url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent");
  assert.ok(!call.url.includes(KEY), "the key must never be in the URL");
  assert.equal(call.init.method, "POST");
  assert.equal((call.init.headers as Record<string, string>)["x-goog-api-key"], KEY);
  assert.ok(call.init.signal, "requests carry a timeout signal");

  assert.deepEqual(call.body.systemInstruction, { parts: [{ text: "Be terse." }] });
  assert.equal(call.body.contents.length, 1);
  assert.equal(call.body.contents[0].role, "user");
  assert.deepEqual(call.body.contents[0].parts[0], { text: "Describe the screen." });
  assert.deepEqual(call.body.contents[0].parts[1], { inlineData: { mimeType: "image/jpeg", data: "AAAA" } });

  assert.equal(call.body.generationConfig.responseMimeType, "application/json");
  const sent = call.body.generationConfig.responseJsonSchema;
  assert.ok(sent, "responseJsonSchema is set");
  assert.equal(JSON.stringify(sent).includes("additionalProperties"), false, "additionalProperties is stripped recursively");
  assert.deepEqual(sent.properties.tags.items.properties.n, { type: "string" });
  assert.deepEqual(sent.required, ["title"]);
});

test("role mapping: assistant turns become model turns, and text-only content is a single part", async () => {
  const f = fakeFetch([
    () =>
      sseResponse([
        { candidates: [{ content: { role: "model", parts: [{ text: "ok" }] }, finishReason: "STOP" }] },
      ]),
  ]);
  await client(f.fn).stream({
    tier: "quality",
    system: "sys",
    messages: [
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello there" },
      { role: "user", content: [{ type: "text", text: "again" }] },
    ],
    tools: [],
    onDelta: () => {},
  });
  const contents = f.calls[0].body.contents;
  assert.deepEqual(contents.map((c: { role: string }) => c.role), ["user", "model", "user"]);
  assert.deepEqual(contents[1].parts, [{ text: "hello there" }]);
  assert.equal(f.calls[0].url.endsWith("/gemini-3.8-flash:streamGenerateContent?alt=sse"), true);
  assert.equal(f.calls[0].body.tools, undefined, "no tools when none are given");
});

test("JSON parsing: fenced JSON is accepted and validation errors propagate", async () => {
  const f = fakeFetch([() => jsonResponse(candidate('```json\n{"n": 3}\n```')), () => jsonResponse(candidate('{"n": "x"}'))]);
  const gemini = client(f.fn);
  const n = await gemini.json({ tier: "fast", system: "s", content: "c", schema: { type: "object" }, validate: (v) => (v as { n: number }).n });
  assert.equal(n, 3);
  await assert.rejects(
    gemini.json({
      tier: "fast",
      system: "s",
      content: "c",
      schema: { type: "object" },
      validate: (v) => {
        if (typeof (v as { n: unknown }).n !== "number") throw new Error("invalid n");
        return 0;
      },
    }),
    /invalid n/,
  );
});

test("streaming: text deltas arrive in order, a functionCall is returned, and usage is ignored safely", async () => {
  const f = fakeFetch([
    () =>
      sseResponse([
        { candidates: [{ content: { role: "model", parts: [{ text: "Hel" }] } }] },
        { candidates: [{ content: { role: "model", parts: [{ text: "lo " }] } }] },
        {
          candidates: [
            {
              content: {
                role: "model",
                parts: [{ functionCall: { name: "set_todos", args: { items: [{ text: "Draft the rules", done: false }] } } }],
              },
            },
          ],
        },
        { candidates: [{ content: { role: "model", parts: [{ text: "there" }] }, finishReason: "STOP" }], usageMetadata: { totalTokenCount: 9 } },
      ]),
  ]);
  const deltas: string[] = [];
  const res = await client(f.fn).stream({
    tier: "quality",
    system: "s",
    messages: [{ role: "user", content: "go" }],
    tools: [{ name: "set_todos", description: "Replace todos", parameters: { type: "object", additionalProperties: false, properties: { items: { type: "array" } } } }],
    maxTokens: 500,
    onDelta: (d) => deltas.push(d),
  });
  assert.equal(res.text, "Hello there");
  assert.deepEqual(deltas, ["Hel", "lo ", "there"]);
  assert.deepEqual(res.toolUses, [{ name: "set_todos", input: { items: [{ text: "Draft the rules", done: false }] } }]);

  const call = f.calls[0];
  assert.match(call.url, /:streamGenerateContent\?alt=sse$/);
  const decl = call.body.tools[0].functionDeclarations[0];
  assert.equal(decl.name, "set_todos");
  assert.equal(JSON.stringify(decl.parameters).includes("additionalProperties"), false);
  assert.ok(call.body.generationConfig.maxOutputTokens >= 500, "the requested cap is a floor, never lowered");
});

test("error mapping: status and Google's message, with the key never present", async () => {
  const f = fakeFetch([
    () =>
      jsonResponse(
        { error: { code: 400, message: `API key not valid. Please pass a valid API key (${KEY}).`, status: "INVALID_ARGUMENT" } },
        400,
      ),
  ]);
  await assert.rejects(client(f.fn).complete({ tier: "fast", system: "s", content: "c" }), (err: Error & { status?: number }) => {
    assert.match(err.message, /400/);
    assert.match(err.message, /API key not valid/);
    assert.ok(!err.message.includes(KEY), "error text must not contain the key");
    assert.equal(err.status, 400);
    return true;
  });
  assert.equal(f.calls.length, 1, "400 is not retried");
});

test("error mapping: a network failure is scrubbed of the key", async () => {
  const failing = (async () => {
    throw new Error(`socket hang up for ${KEY}`);
  }) as unknown as typeof fetch;
  await assert.rejects(client(failing).complete({ tier: "fast", system: "s", content: "c" }), (err: Error) => {
    assert.match(err.message, /Gemini request failed/);
    assert.ok(!err.message.includes(KEY));
    return true;
  });
});

test("retry: one retry with back-off on 429, then success", async () => {
  const f = fakeFetch([() => jsonResponse({ error: { message: "quota" } }, 429), () => jsonResponse(candidate("done"))]);
  const text = await client(f.fn).complete({ tier: "fast", system: "s", content: "c" });
  assert.equal(text, "done");
  assert.equal(f.calls.length, 2);
});

test("retry: 503 twice gives up with the status after exactly two attempts", async () => {
  const f = fakeFetch([() => jsonResponse({ error: { message: "overloaded" } }, 503), () => jsonResponse({ error: { message: "overloaded again" } }, 503)]);
  await assert.rejects(client(f.fn).complete({ tier: "fast", system: "s", content: "c" }), /Gemini API error 503: overloaded again/);
  assert.equal(f.calls.length, 2);
});

test("refusals: SAFETY and PROHIBITED_CONTENT throw, both for complete and for streams", async () => {
  const f = fakeFetch([
    () => jsonResponse({ candidates: [{ finishReason: "SAFETY", content: { parts: [] } }] }),
    () => jsonResponse(candidate("", "PROHIBITED_CONTENT")),
    () => sseResponse([{ candidates: [{ content: { parts: [{ text: "partial" }] }, finishReason: "SAFETY" }] }]),
  ]);
  const gemini = client(f.fn);
  await assert.rejects(gemini.complete({ tier: "fast", system: "s", content: "c" }), /model refusal \(SAFETY\)/);
  await assert.rejects(gemini.complete({ tier: "fast", system: "s", content: "c" }), /model refusal|no text/);
  await assert.rejects(gemini.stream({ tier: "fast", system: "s", messages: [{ role: "user", content: "c" }], tools: [], onDelta: () => {} }), /model refusal \(SAFETY\)/);
});

test("empty replies and missing candidates are errors, not empty strings", async () => {
  const f = fakeFetch([() => jsonResponse({ candidates: [] }), () => jsonResponse(candidate("   "))]);
  await assert.rejects(client(f.fn).complete({ tier: "fast", system: "s", content: "c" }), /no candidates/);
  await assert.rejects(client(f.fn).complete({ tier: "fast", system: "s", content: "c" }), /no text/);
});

test("schema helper strips additionalProperties and $schema everywhere and keeps the rest", () => {
  const out = geminiSchema({
    $schema: "x",
    type: "object",
    additionalProperties: false,
    properties: { a: { type: "array", items: { type: "object", additionalProperties: true, properties: { b: { enum: ["x", "y"] } } } } },
    required: ["a"],
  });
  assert.deepEqual(out, {
    type: "object",
    properties: { a: { type: "array", items: { type: "object", properties: { b: { enum: ["x", "y"] } } } } },
    required: ["a"],
  });
});

test("provider auto-detection and engine wiring", () => {
  assert.equal(resolveProvider({}, { GEMINI_API_KEY: KEY }), "gemini");
  assert.equal(resolveProvider({}, { GEMINI_API_KEY: KEY, ANTHROPIC_API_KEY: "a" }), "gemini");
  assert.equal(resolveProvider({}, { ANTHROPIC_API_KEY: "a" }), "anthropic");
  assert.equal(resolveProvider({}, { PW_AI_PROVIDER: "gemini" }), "gemini");
  assert.equal(resolveProvider({}, {}), "mock");
  assert.equal(resolveProvider({}, { PW_AI_PROVIDER: "practice", GEMINI_API_KEY: KEY }), "mock", "practice forces offline even with a key");

  assert.deepEqual(resolveModels("gemini", {}), MODELS);
  assert.deepEqual(resolveModels("gemini", { PW_GEMINI_MODEL_QUALITY: "q2", PW_GEMINI_MODEL_FAST: "f2" }), { quality: "q2", fast: "f2" });

  const live = createAiEngine({ mode: "live" }, { GEMINI_API_KEY: KEY });
  assert.equal(live.mode, "live");
  assert.equal(live.provider, "gemini");
  assert.deepEqual(live.models, MODELS);

  const forcedMock = createAiEngine({ mode: "mock" }, { GEMINI_API_KEY: KEY });
  assert.equal(forcedMock.mode, "mock");
  assert.equal(forcedMock.provider, "practice");

  const noKey = createAiEngine({}, { PW_AI_PROVIDER: "gemini" });
  assert.equal(noKey.mode, "mock", "an explicit provider without its key falls back to practice");
  assert.equal(noKey.provider, "practice");
});

test("the client satisfies the provider-neutral interface", () => {
  const c: LlmClient = client(fakeFetch([() => jsonResponse(candidate("x"))]).fn);
  assert.equal(c.provider, "gemini");
  assert.deepEqual(c.models, MODELS);
});
