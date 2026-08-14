import { FadeIn } from "@/components/landing/fade-in";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Lumia.PM tam olarak kimin için?",
    answer:
      "Mimarlık ve iç mimarlık ofisleri için tasarlandı: render/çizim onayı, FF&E ve tedarik takibi, RFI, değişiklik emri, submittal ve ruhsat süreçleriyle günlük olarak uğraşan ekipler. Genel amaçlı bir proje aracı değil.",
  },
  {
    question: "Ekibim şu an Excel ve e-postaya alışkın, geçiş zor olur mu?",
    answer:
      "Hayır. Yeni bir proje kurmak birkaç dakika sürer; malzeme listenizi Excel'den kopyala-yapıştır ile aktarabilirsiniz. Ekibin öğrenmesi gereken tek şey mevcut iş akışının (onay, RFI, değişiklik emri) artık nerede yaşadığı.",
  },
  {
    question: "Verilerimiz güvende mi, kim erişebilir?",
    answer:
      "Workspace ve proje seviyesinde rol tabanlı izinler tanımlarsınız; kimin görebileceğini, düzenleyebileceğini siz belirlersiniz. Müşteri onayı gibi dışarıya açılan akışlarda misafirlere sadece kısıtlı, ilgili görsele özel erişim verilir.",
  },
  {
    question: "Kendi sunucumuzda çalıştırabilir miyiz?",
    answer:
      "Evet, Kurumsal planda kendi sunucunuzda (self-host) çalıştırma seçeneği sunuyoruz. Free ve Premium planlar bizim yönettiğimiz bulutta çalışır.",
  },
  {
    question: "Free plan gerçekten sonsuza dek ücretsiz mi?",
    answer:
      "Evet. 3 kullanıcı ve 2 projeye kadar kredi kartı bilgisi istemeden, süresiz kullanabilirsiniz. Premium'u denemek isterseniz 14 günlük deneme de kart bilgisi gerektirmez.",
  },
  {
    question: "İstediğim zaman iptal edebilir miyim, verilerim ne olur?",
    answer:
      "Aboneliğinizi istediğiniz an iptal edebilirsiniz; plan faturalandırma döneminin sonuna kadar aktif kalır. Verilerinizi istediğiniz zaman dışa aktarabilirsiniz.",
  },
  {
    question: "Lumia.PM her ölçekten ofis için mantıklı mı?",
    answer:
      'Dürüst olmak gerekirse, tek kişilik veya çok küçük ölçekli işlerde Excel + e-posta hâlâ "yeter" diyebilirsiniz. Lumia.PM\'in asıl değeri, birden fazla kişinin aynı projede çalıştığı, birden fazla projenin aynı anda yürüdüğü ofislerde ortaya çıkıyor.',
  },
];

export function FAQ() {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <FadeIn>
          <p className="font-medium text-primary text-sm">
            Sık sorulan sorular
          </p>
        </FadeIn>
        <FadeIn delay={40}>
          <h2 className="mt-3 text-balance text-3xl font-semibold leading-tight md:text-4xl">
            Merak ettikleriniz
          </h2>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="mt-10 rounded-2xl border border-border/70 bg-card/70 px-6">
            <Accordion multiple>
              {faqs.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
