import type { Comparison } from "@/components/landing/comparison-page";

export const comparisons: Record<string, Comparison> = {
  monday: {
    competitor: "Monday.com",
    heading: "Mimarlık ofisleri için Monday.com alternatifi",
    subheading:
      "Monday.com esnek ve güçlü bir genel amaçlı proje aracı, ama RFI, submittal, değişiklik emri veya ruhsat takibi gibi ihtiyaçlar için sıfırdan board ve otomasyon kurmanız gerekir. Lumia.PM bu iş akışlarını hazır getirir.",
    rows: [
      {
        feature: "FF&E / malzeme + tedarik takibi",
        lumia: true,
        them: "Özel board kurulur",
      },
      { feature: "RFI takibi", lumia: true, them: "Özel board kurulur" },
      {
        feature: "Submittal / revize-yeniden gönder zinciri",
        lumia: true,
        them: false,
      },
      {
        feature: "Değişiklik emri (maliyet/süre etkisi)",
        lumia: true,
        them: "Özel board kurulur",
      },
      { feature: "Ruhsat takibi", lumia: true, them: "Özel board kurulur" },
      { feature: "Render/çizim onay akışı", lumia: true, them: false },
      {
        feature: "Kurulum süresi",
        lumia: "Dakikalar",
        them: "Günler-haftalar",
      },
      { feature: "Otomasyon paywall'ı", lumia: false, them: "Üst planlarda" },
    ],
    reasons: [
      {
        title: "Hazır gelen süreçler",
        body: "RFI, submittal, değişiklik emri ve ruhsat takibi için board, sütun ve otomasyon kurmanıza gerek yok — bu modüller mesleğinizin diline göre zaten hazır.",
      },
      {
        title: "Karmaşık otomasyon yok",
        body: "Monday'de \"submittal reddedilince yeni item oluştur\" gibi bir akış otomasyon kurmayı gerektirir. Lumia.PM'de bu, ürünün kendisi.",
      },
      {
        title: "Basit, öngörülebilir fiyatlandırma",
        body: "Kullanıcı başı sabit fiyat; board sayısına, otomasyon adedine veya entegrasyon sayısına göre değişen bir fiyat karmaşası yok.",
      },
    ],
    honestNote:
      "Ekibiniz mimarlık/iç mimarlık dışında birçok farklı departmanı (satış, pazarlama, İK) tek bir araçta yönetmek istiyorsa, Monday'in geniş şablon kütüphanesi ve esnekliği daha uygun olabilir. Lumia.PM özellikle tasarım ve inşaat idaresi süreçlerine odaklanır.",
  },
  asana: {
    competitor: "Asana",
    heading: "Mimarlık ofisleri için Asana alternatifi",
    subheading:
      "Asana görev ve proje takibinde güçlü, ama inşaat idaresi ve tasarım sürecine özgü bir kavramı yok: RFI, submittal, değişiklik emri, ruhsat takibi hepsi genel görev/form yapılarına sıkıştırılmak zorunda.",
    rows: [
      { feature: "FF&E / malzeme + tedarik takibi", lumia: true, them: false },
      { feature: "RFI takibi (numaralı, durumlu)", lumia: true, them: false },
      {
        feature: "Submittal / revize-yeniden gönder zinciri",
        lumia: true,
        them: false,
      },
      {
        feature: "Değişiklik emri (maliyet/süre etkisi)",
        lumia: true,
        them: false,
      },
      { feature: "Ruhsat takibi", lumia: true, them: false },
      {
        feature: "Kapasite / doluluk görünümü",
        lumia: true,
        them: "Sınırlı (Portfolio, üst plan)",
      },
      { feature: "Render/çizim onay akışı", lumia: true, them: false },
    ],
    reasons: [
      {
        title: "Mesleğe özgü veri modeli",
        body: "Bir submittal, bir görev değildir — kendi durum akışı, revizyon zinciri ve numaralandırması vardır. Asana'da bunu taklit etmek için etiket ve özel alan hilelerine ihtiyaç duyarsınız.",
      },
      {
        title: "Tek ekipte tek araç",
        body: "Tasarım ekibi, saha ekibi ve ofis yönetimi aynı projede aynı dili konuşur: RFI'lar, submittal'lar ve değişiklik emirleri hep aynı yerde.",
      },
      {
        title: "Kapasite görünümü projeler arası çalışır",
        body: "Kim hangi hafta ne kadar dolu — tek bir projeye değil, tüm workspace'e bakar; yeni proje kabul ederken tahmine değil veriye dayanırsınız.",
      },
    ],
    honestNote:
      "Ekibiniz zaten Asana'yı farklı departmanlarda kurumsal standart olarak kullanıyorsa ve inşaat idaresine özgü modüllere ihtiyacınız yoksa, mevcut yatırımı korumak mantıklı olabilir.",
  },
  excel: {
    competitor: "Excel + E-posta",
    heading: "Excel, e-posta ve WhatsApp'tan tek bir sisteme",
    subheading:
      "Birçok mimarlık ve iç mimarlık ofisi hâlâ malzeme listesini Excel'de, onayları e-postada, soruları WhatsApp'ta tutuyor. Bu gerçek rakip — ve gerçek risk, kayıt dışı kalan kararlar ve faturalanmayan iştir.",
    rows: [
      { feature: "Tek, güncel kaynak", lumia: true, them: false },
      {
        feature: 'Versiyon karmaşası ("son_v3_FINAL.xlsx")',
        lumia: false,
        them: true,
      },
      {
        feature: "Onay kararlarının denetlenebilir kaydı",
        lumia: true,
        them: false,
      },
      {
        feature: "Kapsam kayması (scope creep) görünürlüğü",
        lumia: true,
        them: false,
      },
      {
        feature: "Ekip için gerçek zamanlı ortak görünüm",
        lumia: true,
        them: false,
      },
      { feature: "Mobil/tarayıcıdan erişim", lumia: true, them: "Kısmi" },
      {
        feature: "Kurulum maliyeti",
        lumia: "Dakikalar",
        them: 'Zaten "var" ama dağınık',
      },
    ],
    reasons: [
      {
        title: "Kayıt dışı karar kalmaz",
        body: '"Müşteri telefonda onayladı" dediğiniz an, o karar bir daha bulunamaz e-postaya değil, denetlenebilir bir kayda dönüşür.',
      },
      {
        title: "Faturalanmayan iş azalır",
        body: 'Değişiklik emri modülü, kapsam dışı her talebi maliyet etkisiyle görünür kılar — sözlü "tamam" faturasız kalan işe dönüşmez.',
      },
      {
        title: "Ekip aynı dosyanın farklı sürümlerinde çalışmaz",
        body: "Malzeme listesi, onay durumu ve submittal geçmişi herkes için aynı, güncel kaynaktan gelir.",
      },
    ],
    honestNote:
      'Tek kişilik, çok küçük ölçekli işlerde veya proje sayısı çok azsa, Excel + e-posta hâlâ "yeter" diyebilirsiniz. Ekip büyüdükçe ve proje sayısı arttıkça, kayıt dışı kalan kararların maliyeti hızla büyür.',
  },
};
