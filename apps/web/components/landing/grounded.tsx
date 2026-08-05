import { Check, X, Quote } from "lucide-react";

const EXAMPLES = [
  {
    question: "When was Pakistan's independence?",
    answer: "I couldn't find this information in the uploaded course material.",
    grounded: false,
    label: "Not in your material → agent says so",
  },
  {
    question: "What is a closure in JavaScript?",
    answer: "A closure is a function that retains access to its lexical scope even when executed outside that scope, as covered on slide 18 of your JavaScript fundamentals deck.",
    grounded: true,
    label: "Found in your slides → cited answer",
  },
];

export function Grounded() {
  return (
    <section id="grounded" className="border-t border-border/60 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-primary">Grounded by design</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Built to never guess
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              The agent is a Retrieval-Augmented Generation system: it searches your documents first,
              then answers only from what it found. This means:
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Answers cite the exact document and page",
                "Irrelevant retrieval is rejected by a relevance threshold",
                "Out-of-scope questions get an honest refusal, not a guess",
                "Uploaded content is treated as data — prompt injection can't hijack the agent",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            {EXAMPLES.map((ex) => (
              <div key={ex.question} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <Quote className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{ex.question}</p>
                    <p
                      className={
                        ex.grounded
                          ? "mt-2 text-sm leading-relaxed text-muted-foreground"
                          : "mt-2 text-sm italic leading-relaxed text-muted-foreground"
                      }
                    >
                      {ex.answer}
                    </p>
                    <p
                      className={`mt-3 inline-flex items-center gap-1.5 text-xs font-medium ${
                        ex.grounded ? "text-success" : "text-muted-foreground"
                      }`}
                    >
                      {ex.grounded ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      {ex.label}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
