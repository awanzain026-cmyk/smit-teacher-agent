import { GraduationCap, Sparkles } from "lucide-react";

const USER_QUESTION = "Explain the difference between TCP and UDP";

const MOCK_MESSAGE = [
  "TCP and UDP are two transport-layer protocols, and the difference comes down to how they handle delivery:",
  "",
  "**TCP (Transmission Control Protocol)** is **connection-oriented**. It establishes a reliable connection with a three-way handshake, guarantees in-order delivery, and retransmits lost packets. Use it for web browsing, email, and file transfers where accuracy matters more than speed.",
  "",
  "**UDP (User Datagram Protocol)** is **connectionless**. It sends datagrams with no handshake, no delivery guarantees, and no ordering. It's faster and has lower latency, which makes it ideal for video calls, live streaming, and online gaming where occasional packet loss is acceptable.",
];

const SOURCES = [
  { file: "computer-networks-ch3.pdf", page: 42 },
  { file: "lecture-7-transport.pptx", page: 15 },
];

function Chunk({ text, index }: { text: string; index: number }) {
  if (text.startsWith("**")) {
    const rest = text.slice(2);
    const boldMatch = rest.match(/^(.*?)\*\*(.*)$/);
    if (boldMatch) {
      return (
        <p key={index} className="leading-relaxed">
          <strong>{boldMatch[1]}</strong>
          {boldMatch[2]}
        </p>
      );
    }
  }
  if (text === "") return <div key={index} className="h-2" />;
  return (
    <p key={index} className="leading-relaxed">
      {text}
    </p>
  );
}

export function ChatPreview() {
  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="absolute -inset-6 rounded-3xl bg-gradient-to-t from-primary/10 to-transparent blur-2xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          </div>
          <span className="text-xs text-muted-foreground">SMIT AI Teaching Agent</span>
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>

        {/* Messages */}
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-lg rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              {USER_QUESTION}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="rounded-lg rounded-tl-sm border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">
                {MOCK_MESSAGE.map((m, i) => (
                  <Chunk key={i} text={m} index={i} />
                ))}
              </div>

              {/* Source citations */}
              <div className="mt-2.5">
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Sources
                </p>
                <div className="flex flex-wrap gap-2">
                  {SOURCES.map((s) => (
                    <span
                      key={s.file}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {s.file} · p.{s.page}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <span className="flex-1 text-sm text-muted-foreground">Ask a question about your course…</span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
