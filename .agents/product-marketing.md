# Product Marketing Context

**Document version:** v1
**Last updated:** 2026-08-14

## Product Overview
**One-liner:** Mimarlık ve iç mimarlık ofisleri için, Excel ve e-postanın yerini alan proje yönetim platformu.
**What it does:** Lumia.PM, bir mimarlık/iç mimarlık ofisinin bir projeyi kavramdan teslime kadar yürütmesi için gereken iş akışlarını tek yerde toplar: görev/pano yönetimi, faz şablonları (Concept → Schematic Design → Design Development → Construction Documents → Construction Administration), render/çizim onay akışı (revizyon geçmişiyle), FF&E/malzeme listesi ve tedarik takibi, RFI, değişiklik emri (change order), submittal log, ruhsat (permit) takibi ve ekip kapasite/doluluk görünümü. Genel amaçlı bir proje aracı değil; mesleğin kendi fazlarını ve dokümanlarını doğrudan modeller.
**Product category:** Mimarlık/iç mimarlık ofisleri için proje yönetimi yazılımı (dikey SaaS — genel PM araçlarının "shelf"i değil, "mimarlık ofisi operasyon aracı" rafı).
**Product type:** SaaS, self-hosted (Kurumsal planda) seçeneğiyle birlikte.
**Business model:** Kullanıcı/proje sınırlı Free katman + aylık/yıllık abonelik (Premium) + özel fiyatlandırmalı Kurumsal (self-host seçeneği dahil).

## Target Audience
**Target companies:** Türkiye'de 3-50 kişilik mimarlık ve iç mimarlık ofisleri; birden fazla projenin ve birden fazla kişinin aynı anda çalıştığı ofisler asıl değerin ortaya çıktığı segment.
**Decision-makers:** Ofis sahibi/kurucu ortak mimar, proje yöneticisi (PM), baş mimar.
**Primary use case:** Bir projeyi fazlar boyunca (kavram → şematik → tasarım geliştirme → uygulama projesi → şantiye/uygulama) tek bir sistemde, dağınık Excel dosyaları ve e-posta zincirleri olmadan yürütmek.
**Jobs to be done:**
- Render/çizimlerin müşteri onayını, kimin ne zaman ne dediğini kaybetmeden takip etmek.
- Malzeme (FF&E) seçimi, müşteri onayı ve tedarik/sevkiyat sürecini tek listede yönetmek.
- Müteahhit sorularını (RFI), kapsam değişikliklerini (change order) ve resmi doküman onaylarını (submittal) kayıt altında tutmak.
**Use cases:**
- Bir iç mimarlık ofisinin birden fazla projede aynı anda malzeme siparişi ve teslimat takibi yapması.
- Bir mimarlık ofisinin inşaat idaresi fazında müteahhitle RFI/submittal trafiğini yönetmesi.
- Bir PM'in ekibin önümüzdeki haftalarda kimin ne kadar dolu olduğunu görüp iş dağılımını dengelemesi.

## Personas
| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| Ofis sahibi / kurucu mimar | Kapsam kaymasının faturalanmayan işe dönüşmemesi, ofisin büyüyünce dağılmaması | Her şey e-posta ve Excel'de dağınık; kimse net bir "tek doğru kaynağa" bakmıyor | Kapsam dışı talepler (change order) ve onaylar kayıt altında; ofis büyüdükçe süreç kırılmıyor |
| Proje yöneticisi (PM) | Ekibin haftalık iş yükünü dengelemek, teslim tarihlerini kaçırmamak | Kimin ne kadar dolu olduğunu görmek için tek tek sormak zorunda kalıyor | Doluluk görünümü ve faz bazlı görevlerle tek bakışta durum |
| Baş mimar / tasarımcı | Render ve çizimlerin müşteri onayının net, geri dönülebilir olması | Onay "tamam görünüyor" e-postasıyla veriliyor, hangi revizyonun onaylandığı belirsizleşiyor | Revizyon geçmişi + resmi onay/"değişiklik istendi" durumu ile net karar izi |

## Problems & Pain Points
**Core problem:** Mimarlık/iç mimarlık ofisleri projelerini Excel, e-posta ve genel amaçlı proje araçlarının (Monday, Asana gibi) bir araya getirilmesiyle yürütüyor; hiçbiri mesleğin kendi disiplinlerini (RFI, submittal, FF&E tedariği, faz bazlı bütçe, ruhsat takibi) doğrudan bilmiyor.
**Why alternatives fall short:**
- Excel + e-posta: hiçbir yapı yok, versiyon kontrolü yok, "son karar neydi" sorusu hep açık kalıyor.
- Genel proje araçları (Monday, Asana): esnek pano/görev yapısı var ama mimarlık disiplinini modellemiyor — RFI, submittal, FF&E, faz şablonu gibi kavramlar yok; ofis bunları kendi eklentileriyle simüle etmeye çalışıyor.
**What it costs them:** Kapsam kayması sonucu faturalanmayan iş, gecikmiş tedarik nedeniyle şantiye duraksamaları, onay tartışmalarında "kim ne zaman neyi onayladı" belirsizliği.
**Emotional tension:** Büyük bir projede detayın bir yerde kaybolması korkusu; müşteriyle onay anlaşmazlığında elde somut kayıt olmaması kaygısı.

## Competitive Landscape
**Direct:** Monograph, BQE Core, Deltek, Total Synergy gibi mimarlık-özel PM araçları (Türkiye pazarında yaygın değil, çoğunlukla ABD/İngilizce) — Türkçe değiller, yerel pazara göre fiyatlandırılmamış, ofis kültürüne göre ağır kurulum gerektirebiliyor.
**Secondary:** Monday.com, Asana — genel proje/görev yönetimi, esnek ama mimarlık iş akışını (RFI, submittal, FF&E, faz şablonu) doğrudan desteklemiyor; ofis bunu özel alanlar/otomasyonlarla taklit etmek zorunda kalıyor.
**Indirect:** Excel + e-posta — hâlâ en yaygın "çözüm"; küçük/tek kişilik işlerde yeterli görünebiliyor ama birden fazla kişi/proje büyüdükçe dağılıyor.

## Differentiation
**Key differentiators:**
- Faz şablonları (mimarlık/iç mimarlık fazlarına göre hazır kolonlar) doğrudan proje oluşturmada geliyor.
- Render/çizim onay akışı + revizyon geçmişi tek ekranda.
- FF&E/malzeme listesi, sipariş takibiyle (PO no, kargo, gecikme rozeti) birlikte.
- RFI, submittal log, değişiklik emri (change order) — inşaat idaresi fazının standart dokümanları uygulama içinde, ayrı araç gerekmeden.
- Türkçe arayüz ve Türkiye pazarına göre (TL) fiyatlandırma.
**How we do it differently:** Genel bir proje aracını mimarlığa "uyarlamak" yerine, mesleğin kendi kayıt tiplerini (RFI, submittal, permit, change order) ilk sınıf nesneler olarak modelliyoruz.
**Why that's better:** Ekip, kendi disiplinini yeniden icat etmek ya da başka araçlarla birleştirmek zorunda kalmıyor; her kayıt tipi zaten olması gereken alanlara (durum, atanan kişi, son tarih, karar notu) sahip geliyor.
**Why customers choose us:** Genel araçlardan (Monday/Asana) geçenler kendi iş akışlarını yeniden kurmak zorunda kalmadan doğrudan kullanmaya başlıyor; Excel'den geçenler için düşük geçiş sürtünmesi (kopyala-yapıştır ile malzeme listesi aktarımı) sunuyoruz.

## Objections
| Objection | Response |
|-----------|----------|
| "Ekibim Excel'e alışkın, geçiş zor olur" | Kurulum birkaç dakika sürer, malzeme listesi Excel'den kopyala-yapıştır ile aktarılabilir; öğrenilmesi gereken tek şey mevcut iş akışının artık nerede yaşadığı. |
| "Verilerimiz güvende mi?" | Workspace/proje seviyesinde rol tabanlı izinler var; müşteri onayı gibi dışa açık akışlarda misafirlere sadece kısıtlı, ilgili görsele özel erişim veriliyor. |
| "Küçük ofisiz, buna ihtiyacımız yok" | Doğru olabilir — tek kişilik ya da çok küçük işlerde Excel + e-posta hâlâ yeterli olabilir; asıl değerimiz birden fazla kişinin/projenin aynı anda yürüdüğü ofislerde ortaya çıkıyor. |

**Anti-persona:** Tek kişilik ya da çok küçük ölçekli, tek seferde tek proje yürüten ofisler/serbest çalışanlar — bunlar için Excel + e-posta hâlâ "yeter" olabilir, Lumia.PM'in koordinasyon değeri düşük kalır.

## Switching Dynamics
**Push:** Kapsam kayması nedeniyle faturalanmayan iş; "son karar neydi" belirsizliğinin yarattığı müşteri anlaşmazlıkları; tedarik gecikmelerinin şantiyede fark edilmeden büyümesi.
**Pull:** Mesleğin kendi kayıt tiplerinin (RFI, submittal, FF&E, permit) hazır gelmesi; Türkçe arayüz ve yerel fiyatlandırma; düşük geçiş sürtünmesi.
**Habit:** Ekip zaten Excel şablonlarına ve e-posta zincirlerine alışkın; yeni bir araç öğrenme isteksizliği.
**Anxiety:** Verilerin (proje geçmişi, onay kayıtları) yeni bir sisteme taşınırken kaybolması korkusu; ekibin yeni araca adapte olamama riski.

## Customer Language
**How they describe the problem:** *(Henüz doğrudan müşteri görüşmesi yapılmadı — bu bölüm gerçek görüşme/anket sonrası verbatim alıntılarla doldurulacak.)*
**How they describe us:** *(Aynı şekilde — henüz gerçek kullanıcı geri bildirimi yok.)*
**Words to use:** dürüst, net, faz, onay, tedarik, kapsam, ofis, ekip.
**Words to avoid:** "devrim yaratan", "yapay zeka destekli" gibi ürünle ilgisi olmayan abartılı iddialar; gerçek olmayan müşteri/istatistik iddiaları.
**Glossary:**
| Term | Meaning |
|------|---------|
| FF&E | Furniture, Fixtures & Equipment — malzeme/mobilya listesi ve tedarik takibi modülü |
| RFI | Request for Information — müteahhitin sorduğu, yapılandırılmış teknik soru-cevap kaydı |
| Submittal | Alt yüklenici/tedarikçinin gönderdiği teknik dokümanın (malzeme onay formu, imalat çizimi) inceleme/onay süreci |
| Change order | Müşteri kaynaklı ek talebin maliyet/süre etkisiyle kayıt altına alınıp onaylanması |
| Permit | Ruhsat başvurusunun dahili durum takibi |

## Brand Voice
**Tone:** Dürüst, net, abartısız — rakiplerle karşılaştırmada bile "biz her zaman daha iyiyiz" demek yerine dürüst notlar (ör. "büyük kurumsal ekiplerde X daha güçlü olabilir") kullanma alışkanlığı var.
**Style:** Doğrudan, teknik jargonu gerektiğinde açıklayan ama gereksiz süslemeden kaçınan.
**Personality:** Güvenilir, pratik, mesleği anlayan, mütevazı, şeffaf.

## Proof Points
**Metrics:** *(Henüz yok — canlı kullanıcı/müşteri verisi oluştuğunda eklenecek.)*
**Customers:** *(Henüz yok — gerçek müşteri isimleri olmadan burada isim kullanılmayacak.)*
**Testimonials:** *(Henüz yok — fabrike testimonial kullanılmayacak, sadece gerçek referanslar eklenecek.)*
**Value themes:**
| Theme | Proof |
|-------|-------|
| Kapsam kayması görünür hale gelir | Change order modülü — henüz nicel veri yok, mekanizma canlı |
| Tedarik gecikmeleri erken fark edilir | FF&E "Gecikti" rozeti — henüz nicel veri yok, mekanizma canlı |

## Goals
**Business goal:** Türkiye'deki mimarlık/iç mimarlık ofislerinde Excel + e-posta + genel PM araçları kombinasyonunun yerini almak; Free katmandan Premium'a dönüşümü büyütmek.
**Conversion action:** "Ücretsiz Dene" (14 gün, kredi kartı gerekmeden) veya Free plana kayıt.
**Current metrics:** *(Henüz yok — ürün henüz canlıya alınmadı/erken aşamada.)*

## Changelog
*Newest first. One line per revision: what changed and why.*
- v1 (2026-08-14) — İlk taslak: bu oturumda kurulan Lumia.PM konumlandırması, rakip analizi, fiyatlandırma ve marka sesi (dürüst/net/abartısız) referans alınarak kod tabanı ve önceki pazarlama çalışmasından derlendi. Proof Points ve Customer Language bölümleri gerçek müşteri verisi olmadığı için kasıtlı olarak boş bırakıldı.
