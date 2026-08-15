import { FadeIn } from "@/components/landing/fade-in";

export function FounderStatement() {
  return (
    <section id="why" className="px-6 py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <FadeIn>
          <h2 className="text-3xl font-semibold md:text-4xl">
            Why Lumia.PM exists
          </h2>
        </FadeIn>
        <FadeIn delay={80}>
          <div className="mt-6 space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p>
              I&apos;m{" "}
              <strong className="font-medium text-foreground">
                Murat Yüksel
              </strong>
              , and I built Lumia.PM after watching how much of an interior
              architecture studio&apos;s work happens{" "}
              <strong className="font-medium text-foreground">
                outside any tool
              </strong>{" "}
              — a render gets emailed over, a client replies "looks good" in a
              WhatsApp message three days later, and nobody has a clean record
              of what was actually approved.
            </p>
            <p>
              Generic project management software wasn&apos;t built for that
              moment. It assumes your client has an account, wants a login, and
              cares about your internal workflow. They don&apos;t —{" "}
              <strong className="font-medium text-foreground">
                they just want to see the render and say yes or no
              </strong>
              .
            </p>
            <p>
              Lumia.PM is built around that one moment: your team plans and
              executes the work, and your client gets a single branded link —
              your studio&apos;s name and mark, not ours — where they review and
              approve, with{" "}
              <strong className="font-medium text-foreground">
                a record of who decided what, and when
              </strong>
              .
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
