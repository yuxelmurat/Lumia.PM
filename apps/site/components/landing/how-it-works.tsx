import { FadeIn } from "@/components/landing/fade-in";

const steps = [
  {
    number: "1",
    title: "Workspace'inizi kurun",
    body: "Ofisinizi ve ilk projenizi oluşturun; mimarlık veya iç mimarlık faz şablonunu seçin, ekibinizi davet edin. Beş dakikadan az sürer.",
  },
  {
    number: "2",
    title: "Mevcut projelerinizi taşıyın",
    body: "Malzeme listenizi, açık RFI'larınızı ve bekleyen onaylarınızı içeri aktarın ya da sıfırdan başlayın — Excel'den kopyala-yapıştır yeterli.",
  },
  {
    number: "3",
    title: "Ekip ve müşteri aynı yerden çalışsın",
    body: "Render onaya gitsin, malzeme siparişleri takip edilsin, sorular ve değişiklikler kayıt altına alınsın. Herkes aynı güncel kaynağa bakar.",
  },
];

export function HowItWorks() {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <FadeIn>
          <p className="font-medium text-primary text-sm">Nasıl çalışır</p>
        </FadeIn>
        <FadeIn delay={40}>
          <h2 className="mt-3 max-w-2xl text-balance text-3xl font-semibold leading-tight md:text-4xl">
            Ekibinizi geçirmek sandığınızdan kolay
          </h2>
        </FadeIn>
        <FadeIn delay={80}>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Haftalarca süren bir kurulum süreci yok. Bir ofis genelde aynı gün
            içinde ilk projesini Lumia.PM'e taşıyor.
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((step, index) => (
            <FadeIn key={step.title} delay={120 + index * 60}>
              <div className="relative rounded-xl border border-border/70 bg-card p-6">
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-sm"
                >
                  {step.number}
                </span>
                <h3 className="mt-4 font-medium text-base">{step.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  {step.body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
