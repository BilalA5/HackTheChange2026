import { describe, expect, it } from "vitest";
import { chunkSpeech } from "./tts";

describe("chunkSpeech", () => {
  it("starts with one short sentence so speech begins quickly, then groups the rest", () => {
    const text =
      "Here is the number I keep coming back to. Discharge before noon is 19.5% right now. The goal is 23%. Nobody agrees on why.";
    const clips = chunkSpeech(text);
    expect(clips[0]).toBe("Here is the number I keep coming back to.");
    expect(clips.slice(1).join(" ")).toBe("Discharge before noon is 19.5% right now. The goal is 23%. Nobody agrees on why.");
    expect(clips.length).toBe(2);
  });

  it("never splits decimals or version numbers, and keeps every clip under the server limit", () => {
    const long = `${"word ".repeat(150).trim()}, and then ${"more ".repeat(80).trim()}.`;
    const clips = chunkSpeech(`Version 2.1 shipped. ${long}`);
    expect(clips[0]).toBe("Version 2.1 shipped.");
    for (const c of clips) expect(c.length).toBeLessThanOrEqual(320);
    expect(clips.join(" ").replace(/\s+/g, " ")).toBe(`Version 2.1 shipped. ${long}`.replace(/\s+/g, " "));
  });

  it("returns nothing for blank text", () => {
    expect(chunkSpeech("   \n ")).toEqual([]);
  });
});
