import { FadeIn } from "@/components/landing/fade-in";

const cards = [
  {
    title: "Resmî onay akışı",
    body: 'Render ve DWG\'leri ekip veya müşteriye onaya gönderin; "değişiklik istendi" kararında not alın, karar geçmişini denetleyin.',
  },
  {
    title: "Revizyon geçmişi",
    body: "Yeni bir render veya çizim yüklediğinizde önceki versiyonla otomatik zincirlenir; hangi revizyonun onaylandığı hep görünür kalır.",
  },
  {
    title: "Proje şablonları ve faz bütçesi",
    body: "Mimarlık ve iç mimarlık projeleri için hazır faz şablonlarıyla başlayın, her faza saat bütçesi tanımlayıp aşımı erkenden görün.",
  },
  {
    title: "Punch list ve proje kapanışı",
    body: "Şantiye eksik/kusur listesini render üzerindeki pinlerle tutun; açık kalem varken proje kapanışını kilitleyin.",
  },
  {
    title: "Rol tabanlı izinler",
    body: "Kimin ne görebileceğini, düzenleyebileceğini workspace ve proje seviyesinde tanımlayın; misafir onayına ayrı, kısıtlı erişim verin.",
  },
  {
    title: "DWG görüntüleyici",
    body: "AutoCAD çizimlerini tarayıcıda açın, üzerine not/pin bırakın — ayrı bir CAD lisansına ihtiyaç duymadan.",
  },
];

export function Features() {
  return (
    <section id="neden" className="relative bg-sidebar/55 px-6 py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <FadeIn>
          <p className="font-medium text-primary text-sm">Neden Lumia.PM</p>
        </FadeIn>
        <FadeIn delay={40}>
          <h2 className="mt-3 max-w-2xl text-balance text-3xl font-semibold leading-tight md:text-4xl">
            Genel bir proje aracı değil, mesleğinizin aracı
          </h2>
        </FadeIn>
        <FadeIn delay={80}>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Kanban, Gantt ve zaman takibi gibi temel proje yönetimi
            özelliklerinin yanında, mimarlık ofislerinin gerçekten kullandığı
            süreçler:
          </p>
        </FadeIn>

        <FadeIn delay={140}>
          <div className="mt-10 rounded-2xl border border-border/70 bg-card/70 p-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-xl border border-border/70 bg-card p-6"
                >
                  <h3 className="text-sm font-medium">{card.title}</h3>
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    {card.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
