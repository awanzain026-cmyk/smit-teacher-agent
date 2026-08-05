import { describe, expect, it } from "vitest";
import { chunkText, estimateTokens } from "../src/services/chunkerService.js";

describe("chunkText", () => {
  it("returns a single chunk for short input", () => {
    const chunks = chunkText("short text", { chunkSize: 800, overlap: 120 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.text).toBe("short text");
    expect(chunks[0]?.page).toBeNull();
  });

  it("splits long input into multiple chunks", () => {
    const long = Array.from({ length: 50 }, (_, i) => `Paragraph number ${i} with some padding words to lengthen it.`).join("\n\n");
    const chunks = chunkText(long, { chunkSize: 200, overlap: 40 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.text.length).toBeGreaterThan(0);
    }
  });

  it("tracks page numbers across form feeds", () => {
    const text = "Page one content.\fPage two content.\fPage three content.";
    const chunks = chunkText(text, { chunkSize: 800, overlap: 120 });
    expect(chunks.map((c) => c.page)).toEqual([1, 2, 3]);
  });

  it("rejects invalid chunk parameters", () => {
    expect(() => chunkText("x", { chunkSize: 10, overlap: 20 })).toThrow(/chunkSize must exceed overlap/);
  });

  it("does not produce empty chunks", () => {
    const chunks = chunkText("   \n\n   \n   word  \n\n\n  ", { chunkSize: 100, overlap: 20 });
    for (const c of chunks) {
      expect(c.text.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("estimateTokens", () => {
  it("estimates tokens proportional to length", () => {
    expect(estimateTokens("hello world")).toBe(3);
    expect(estimateTokens("a".repeat(400))).toBe(100);
  });
});
