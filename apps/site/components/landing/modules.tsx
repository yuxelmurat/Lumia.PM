import { FadeIn } from "@/components/landing/fade-in";
import { cn } from "@/lib/utils";

type Module = {
  eyebrow: string;
  title: string;
  body: string;
  simplifies: string[];
  image: string;
  imageAlt: string;
};

const modules: Module[] = [
  {
    eyebrow: "FF&E & Tedarik",
    title: "Malzeme listesi ve sipariş takibi tek yerde",
    body: "Oda, tedarikçi, birim fiyat ve referans görseliyle malzeme listesi tutun; sipariş verilince PO numarası, beklenen/gerçek sevkiyat tarihi ve kargo takip bilgisini ekleyin.",
    simplifies: [
      "Ayrı bir Excel'de malzeme takibi tutma ihtiyacını ortadan kaldırır",
      'Gecikmiş siparişleri "Gecikti" rozetiyle otomatik işaretler',
      'Müşteriye "hangi malzeme nerede" sorusuna anında cevap verir',
    ],
    image: "/screenshots/materials.png",
    imageAlt: "Lumia.PM malzeme (FF&E) listesi, gecikmiş sipariş rozetiyle",
  },
  {
    eyebrow: "Submittal Takibi",
    title: "Onay formları için versiyon karmaşası bitsin",
    body: 'Alt yüklenicinin gönderdiği imalat çizimi veya malzeme onay formunu inceleyin; "revize edip yeniden gönder" dediğinizde yeni submittal otomatik olarak öncekine bağlanır.',
    simplifies: [
      "Hangi versiyonun onaylandığını e-posta zincirinde aramayı bitirir",
      "Sıralı numaralandırma (SUB-1, SUB-2...) ile resmi kayıt oluşturur",
      "Revizyon geçmişini tek tıkla görünür kılar",
    ],
    image: "/screenshots/submittals.png",
    imageAlt:
      "Lumia.PM submittal listesi, revize et ve yeniden gönder durumuyla",
  },
  {
    eyebrow: "RFI",
    title: "Şantiyeden gelen sorular kaybolmasın",
    body: "Müteahhitin sorduğu teknik soruları numaralandırılmış, durumlu bir kayıt olarak tutun; kim sordu, kim cevapladı, ne zaman kapandı — hepsi tek ekranda.",
    simplifies: [
      "WhatsApp ve e-posta üzerinden dağınık soru-cevap trafiğini toplar",
      "Sorumluyu ve son tarihi net şekilde atar",
      "Açık/cevaplanmış/kapalı durumuyla resmî bir iz bırakır",
    ],
    image: "/screenshots/rfi.png",
    imageAlt: "Lumia.PM RFI listesi",
  },
  {
    eyebrow: "Değişiklik Emri",
    title: "Kapsam kayması artık görünür ve faturalanabilir",
    body: 'Müşteri kaynaklı ek talepleri maliyet ve süre etkisiyle kayıt altına alın, onay/red sürecini takip edin — sözlü "olur" faturasız kalan işe dönüşmesin.',
    simplifies: [
      '"Bunu da ekleyelim" taleplerini kayıt dışı bırakmaz',
      "Maliyet ve saat etkisini onay öncesi görünür kılar",
      "Faturalanmayan iş riskinin en büyük kaynağını ortadan kaldırır",
    ],
    image: "/screenshots/change-orders.png",
    imageAlt: "Lumia.PM değişiklik emri listesi, maliyet ve saat etkisiyle",
  },
  {
    eyebrow: "Ruhsat Takibi",
    title: "Hangi projenin ruhsatı hangi aşamada?",
    body: "Belediye/ilgili kurum başvurularının durumunu (başvuruldu, düzeltme istendi, onaylandı, ruhsat verildi) tek bir ekrandan izleyin, resmi ruhsat numarasını kaydedin.",
    simplifies: [
      "Ruhsat sürecini takip etmek için ayrı bir not defteri ihtiyacını kaldırır",
      'Ekip içinde "bu iş kimde" belirsizliğini giderir',
      "Projeler arası ruhsat durumunu tek bakışta gösterir",
    ],
    image: "/screenshots/permits.png",
    imageAlt: "Lumia.PM ruhsat takibi listesi",
  },
  {
    eyebrow: "Kapasite (Workload)",
    title: "Yeni proje almadan önce ekibin doluluğunu görün",
    body: "Görevlere tahmini saat girin; workload görünümü projeler arası kimin hangi hafta ne kadar dolu olduğunu gösterir, 40 saati aşan haftaları otomatik işaretler.",
    simplifies: [
      '"Bu ay kaç proje daha alabiliriz?" sorusunu tahminden veriye taşır',
      "Aşırı yüklenmiş ekip üyelerini erkenden görünür kılar",
      "Proje bazlı değil, kişi bazlı, projeler arası gerçek doluluğu gösterir",
    ],
    image: "/screenshots/workload.png",
    imageAlt:
      "Lumia.PM kapasite (workload) görünümü, haftalık saat toplamlarıyla",
  },
];

export function Modules() {
  return (
    <section id="moduller" className="px-6 py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <FadeIn>
          <p className="font-medium text-primary text-sm">Modüller</p>
        </FadeIn>
        <FadeIn delay={40}>
          <h2 className="mt-3 max-w-2xl text-balance text-3xl font-semibold leading-tight md:text-4xl">
            Genel araçların modellemediği iş akışları
          </h2>
        </FadeIn>
        <FadeIn delay={80}>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Bunlar, Monday veya Asana gibi genel araçlarda karşılığı olmayan,
            doğrudan mimarlık ve iç mimarlık ofislerinin günlük iş akışından
            çıkarılmış modüller.
          </p>
        </FadeIn>

        <div className="mt-14 space-y-20 md:mt-16 md:space-y-28">
          {modules.map((mod, index) => {
            const imageFirst = index % 2 === 1;
            return (
              <FadeIn key={mod.title} delay={0} distance={16}>
                <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
                  <div
                    className={cn(
                      "overflow-hidden rounded-xl border border-border/70 bg-background shadow-lg ring-1 ring-black/5",
                      imageFirst ? "md:order-1" : "md:order-2",
                    )}
                  >
                    <img
                      src={mod.image}
                      alt={mod.imageAlt}
                      className="w-full"
                      loading="lazy"
                    />
                  </div>
                  <div className={imageFirst ? "md:order-2" : "md:order-1"}>
                    <p className="font-medium text-primary text-sm">
                      {mod.eyebrow}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold leading-tight md:text-3xl">
                      {mod.title}
                    </h3>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                      {mod.body}
                    </p>
                    <ul className="mt-5 space-y-2.5">
                      {mod.simplifies.map((line) => (
                        <li
                          key={line}
                          className="flex items-start gap-2.5 text-sm"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                          />
                          <span className="text-foreground/85">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
