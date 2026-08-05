import { describe, expect, it } from "vitest";
import { ragService } from "../src/services/ragService.js";

describe("ragService", () => {
  it("builds deduplicated sources per document+page", () => {
    const sources = ragService.buildSources([
      { text: "a", fileName: "notes.pdf", documentId: "d1", page: 1, score: 0.9 },
      { text: "b", fileName: "notes.pdf", documentId: "d1", page: 1, score: 0.8 },
      { text: "c", fileName: "notes.pdf", documentId: "d1", page: 2, score: 0.7 },
      { text: "d", fileName: "slides.pptx", documentId: "d2", page: null, score: 0.6 },
    ]);

    expect(sources).toHaveLength(3);
    expect(sources.map((s) => s.page)).toEqual([1, 2, null]);
  });

  it("trims history to the last N turns", () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "model") as "user" | "model",
      content: `msg ${i}`,
    }));
    const trimmed = ragService.trimHistory(history, 8);
    expect(trimmed).toHaveLength(8);
    expect(trimmed[0]?.content).toBe("msg 12");
    expect(trimmed[7]?.content).toBe("msg 19");
  });

  it("keeps short history intact", () => {
    const history = [
      { role: "user" as const, content: "hi" },
      { role: "model" as const, content: "hello" },
    ];
    expect(ragService.trimHistory(history, 8)).toHaveLength(2);
  });
});
