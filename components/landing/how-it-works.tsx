import { Upload, SlidersHorizontal, MessageCircle } from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    step: "01",
    title: "Upload your material",
    description:
      "Drop in lecture slides, notes, past papers, or any course PDF/DOCX/PPTX/TXT. The system parses the text and safely stores the original file.",
  },
  {
    icon: SlidersHorizontal,
    step: "02",
    title: "We build your knowledge base",
    description:
      "Documents are split into optimized chunks, converted into embeddings, and indexed in a vector database — organized by course and ready for instant retrieval.",
  },
  {
    icon: MessageCircle,
    step: "03",
    title: "Ask, and verify",
    description:
      "Chat naturally with your material. Every answer cites the exact document and page it came from, so you can always go back to the source.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border/60 bg-muted/20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            From files to tutor in three steps
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.step} className="relative">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-sm font-medium text-muted-foreground">{s.step}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
