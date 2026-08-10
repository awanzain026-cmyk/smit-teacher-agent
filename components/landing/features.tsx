import { BookOpen, FileSearch, BadgeCheck, ShieldCheck, MessageSquareText, Library } from "lucide-react";

const FEATURES = [
  {
    icon: Library,
    title: "Your course material, indexed",
    description:
      "Upload PDFs, DOCX, PPTX and TXT files. Each document is parsed, chunked, and embedded into a searchable knowledge base — organized by course.",
  },
  {
    icon: MessageSquareText,
    title: "Chat grounded in your documents",
    description:
      "Ask questions in natural language. Every answer is generated from retrieved context within your own materials — never from generic web knowledge.",
  },
  {
    icon: BadgeCheck,
    title: "Source citations on every answer",
    description:
      "Each response links to the exact document and page it came from, so you can verify, revisit, and study the original material.",
  },
  {
    icon: ShieldCheck,
    title: "No hallucinations, guaranteed",
    description:
      "If the answer isn't in your uploaded material, the agent says so explicitly instead of making something up. Context-aware retrieval with relevance thresholds.",
  },
  {
    icon: FileSearch,
    title: "Fast semantic search",
    description:
      "Vector-based retrieval finds the most relevant passages — even when you don't remember the exact wording — in milliseconds.",
  },
  {
    icon: BookOpen,
    title: "Conversation history",
    description:
      "Every chat is saved and searchable. Resume a discussion any time and keep your study threads organized.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-border/60 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Features</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            A study companion that actually knows your material
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Built for SMIT students, the agent turns your scattered course files into an intelligent,
            always-available tutor.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground transition-transform group-hover:scale-105">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
