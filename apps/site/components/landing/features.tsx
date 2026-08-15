import { FadeIn } from "@/components/landing/fade-in";

export function Features() {
  return (
    <section
      id="features"
      className="relative bg-sidebar/55 px-6 py-16 md:py-20"
    >
      <div className="mx-auto w-full max-w-6xl">
        <FadeIn>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-2">
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
              <article className="rounded-xl border border-border/70 bg-card p-6 lg:col-span-5 lg:p-8">
                <p className="font-medium text-muted-foreground text-sm">
                  Client approval
                </p>
                <h2 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">
                  A branded link, not a login your client needs.
                </h2>
                <p className="mt-4 max-w-xl text-muted-foreground text-base leading-relaxed">
                  Share a read-only, branded link to any project. Your client
                  opens it, sees your studio&apos;s own logo, and approves or
                  requests changes on a render — no account, no workspace chrome
                  to navigate.
                </p>
                <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 p-4">
                  <h3 className="text-sm font-medium">
                    Every decision, on record
                  </h3>
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    Approvals capture who responded and when — a real record for
                    the project file, not just a checkbox.
                  </p>
                </div>
              </article>

              <div className="grid grid-cols-1 gap-2 lg:col-span-7 sm:grid-cols-2">
                <article className="rounded-xl border border-border/70 bg-card p-6">
                  <h3 className="text-sm font-medium">
                    Your studio&apos;s own identity
                  </h3>
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    Upload your logo and company details once; they carry
                    through to every client-facing page.
                  </p>
                </article>

                <article className="rounded-xl border border-border/70 bg-card p-6">
                  <h3 className="text-sm font-medium">
                    Watermark your renders
                  </h3>
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    Tiled, centered, or corner watermarking on any image a
                    client reviews, on by default per workspace.
                  </p>
                </article>

                <article className="rounded-xl border border-border/70 bg-card p-6 sm:col-span-2">
                  <h3 className="text-sm font-medium">
                    Board and list, same source of truth
                  </h3>
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    Plan in list view, execute in board view, and keep statuses,
                    priorities, and labels in sync across your whole studio.
                  </p>
                </article>

                <article className="rounded-xl border border-border/70 bg-card p-6">
                  <h3 className="text-sm font-medium">
                    Planning that stays focused
                  </h3>
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    Assign owners, due dates, and priorities without introducing
                    heavy process.
                  </p>
                </article>

                <article className="rounded-xl border border-border/70 bg-card p-6">
                  <h3 className="text-sm font-medium">
                    Self-hosted by default
                  </h3>
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    Deploy with Docker and keep full ownership of your
                    infrastructure and data.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
