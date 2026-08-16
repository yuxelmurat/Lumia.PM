<p align="center">
  <a href="https://lumiapm.com">
    <img src="https://raw.githubusercontent.com/yuxelmurat/Lumia.PM/main/apps/web/public/logo/logo.png" alt="Lumia.PM logo" width="120" />
  </a>
</p>

<h1 align="center">Lumia.PM</h1>

<p align="center">
  Project management built for interior architecture and design studios.<br />
  İç mimarlık ve tasarım stüdyoları için proje yönetimi.
</p>

<div align="center">

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/yuxelmurat/Lumia.PM/ci.yml?branch=main)](https://github.com/yuxelmurat/Lumia.PM/actions)

</div>

<div align="center">
  <h3>
    <a href="https://lumiapm.com">Website</a>
    <span> | </span>
    <a href="apps/docs">Documentation</a>
    <span> | </span>
    <a href="https://lumiapm.com/about">Contact</a>
  </h3>
</div>

<p align="center">
  <img src="https://raw.githubusercontent.com/yuxelmurat/Lumia.PM/main/apps/site/public/images/hero.png" alt="Lumia.PM dashboard" />
</p>

<div align="center">
  <h3>🇬🇧 <a href="#english">Read in English</a> &nbsp;|&nbsp; 🇹🇷 <a href="#turkce">Türkçe oku</a></h3>
</div>

<br />

<a id="english"></a>

# 🇬🇧 English

## Why Lumia.PM?

Interior architecture and design studios don't run projects like software teams do. A render goes through rounds of revision, a client needs to approve it without ever touching a "real" project management tool, and every studio has its own brand it wants that client-facing moment to carry.

Lumia.PM is built around that workflow: plan projects and run tasks with your team internally, then share a branded, client-facing link so a client can review renders, leave pinned feedback on a specific spot in an image, and approve or request changes — without ever seeing your internal workspace.

**What makes it different:**
- **Client approval built in** — a branded link, not a login your client needs
- **Version history on renders** — see every revision, not just the latest upload
- **Clean interface** that focuses on your work, not the tool
- **Self-hosted** so your data stays yours
- **Open source** with a permissive MIT license

## What Lumia.PM replaces

Most studios currently stitch together a generic task board (Trello, Asana, Monday.com...), a shared drive full of render revisions, an email or WhatsApp thread for client feedback, and a spreadsheet for the FF&E/material list. Lumia.PM folds that into one system:

| Instead of... | Lumia.PM gives you |
|---|---|
| A shared drive of `render_v1_final_v2_FINAL.jpg` files | Built-in version history on every uploaded image |
| Emailing renders back and forth for approval | A branded, no-login client link with pinned comments and an approval action |
| A generic kanban board that doesn't fit design work | Boards, backlog, and custom fields shaped around studio projects |
| Manually re-sending a "clean" watermarked preview | Automatic watermarking on client-shared images |
| One person owning approval in their head | Multi-approver workflows with a visible, resettable approval state |
| A separate export tool for client reports | Built-in PDF export of tasks and project status |

## Features

**Task & project management**
- Kanban board, backlog, and list views with drag-and-drop
- Custom fields per project (materials, room, budget line, or anything your studio tracks)
- Project templates so a new project starts with your studio's standard columns and tasks
- Priorities, due dates, assignees, labels, and bulk task actions
- Task import/export, including PDF export for client-facing reports
- Time entries for tracking hours against tasks

**Visual & render workflow**
- Image uploads with full version history — every revision stays available, not just the latest
- Pin-based annotations directly on an image, tied to a specific point, not a vague comment
- A moodboard-style gallery view for browsing a task's images at a glance
- Automatic watermarking applied to images shared through client links

**Client collaboration**
- Branded, public project links your client opens with no account or login
- Configurable link expiry so client access doesn't stay open indefinitely
- Task approval workflow, including multi-approver setups where more than one stakeholder must sign off, with a visible reset if changes are requested

**Team collaboration**
- Threaded comments and an activity feed per task and project
- Notifications with per-user delivery preferences
- Workflow rules for basic automation (e.g. status changes triggering actions)

**Integrations & extensibility**
- Slack, Discord, Telegram, GitHub, and Gitea integrations
- Generic outgoing webhooks for connecting your own tools
- A built-in MCP (Model Context Protocol) endpoint so AI assistants like Claude or Cursor can read and manage your tasks and projects directly

**Security & hosting**
- Self-hosted by default — your project files and client data live on your own infrastructure
- Workspace-scoped roles and permissions enforced on the API, not just hidden in the UI
- PostgreSQL for durable storage; optional Redis if you're running more than one API instance for realtime delivery
- A Helm chart for Kubernetes deployments alongside the simpler Docker Compose path

## How Lumia.PM compares

Trello, Asana, Monday.com, and ClickUp are mature, general-purpose tools — they have larger integration marketplaces, polished mobile apps, and make sense for teams that just need a generic board. That breadth is real, and it's not what Lumia.PM is trying to win on.

Lumia.PM is narrower on purpose: it's built for the specific handoffs a design studio repeats on every project — getting a render approved by a client who won't log into a PM tool, keeping every revision instead of overwriting the last one, and knowing who signed off before work moves forward. Those aren't add-ons in a generic tool; they're usually solved with a separate e-signature tool, a shared drive, or a checklist someone has to remember to update.

<!-- prettier-ignore -->
| Capability | Lumia.PM | Trello / Asana / Monday / ClickUp |
|:---|:---:|:---:|
| No-login, branded client approval link | ✅ | ⚠️ paid guest seat or 3rd-party tool |
| Pinned feedback on a specific spot in a render | ✅ | ❌ |
| Version history on uploaded images | ✅ | ❌ |
| Multi-approver approval, with reset | ✅ | ⚠️ simulated with checklists |
| Automatic watermarking on client shares | ✅ | ❌ |
| Self-hosted, you own the data | ✅ | ❌ cloud-only on mainstream plans |
| Open source (MIT) | ✅ | ❌ |
| Free at unlimited scale, self-hosted | ✅ | ❌ per-seat pricing |
| Native AI tool access (MCP) | ✅ | ⚠️ limited/paid API |
| Mobile apps & third-party integration marketplace | ⚠️ | ✅ |
| General-purpose boards for non-studio teams | ⚠️ | ✅ |

✅ built in &nbsp;·&nbsp; ⚠️ possible, but not native &nbsp;·&nbsp; ❌ not offered

If your team just needs a generic Trello-style board, any of those tools will do that job well — that's not the gap Lumia.PM is trying to close. It exists for the render-approval, version-history, and client-branded sharing workflow that generic tools don't model natively.

## Getting Started

### Quick Start with Docker Compose

The fastest way to try Lumia.PM is with Docker Compose. This sets up Lumia.PM and PostgreSQL with a single combined container:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env_file:
      - .env
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lumiapm -d lumiapm"]
      interval: 10s
      timeout: 5s
      retries: 5

  lumiapm:
    build:
      context: .
      dockerfile: Dockerfile.lumiapm
    ports:
      - "5173:5173"
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

Save this as `compose.yml`, copy `.env.sample` to `.env`, uncomment `KANEO_CLIENT_URL=http://localhost:5173`, and set `POSTGRES_PASSWORD=<password>` and `AUTH_SECRET=<output of openssl rand -hex 32>`, run `docker compose up -d`, and open [http://localhost:5173](http://localhost:5173).

In Docker Compose, the bundled container reaches PostgreSQL at the service hostname `postgres`.
If you run the API on your host instead of inside Compose, use `localhost` or set `DATABASE_URL` explicitly.

> **Note:** environment variables still use the `KANEO_*` prefix internally (e.g. `KANEO_CLIENT_URL`) — see [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for the full list and why.

### First login

Once the app is running, open it in your browser, create the first account (this becomes your workspace owner), create a workspace for your studio, and add a project. From a project's settings you can generate the branded public link you'll share with clients.

### Development Setup

For development, see our [Environment Setup Guide](ENVIRONMENT_SETUP.md) for detailed instructions on configuring environment variables and troubleshooting common issues like CORS problems.

### Configuration

Lumia.PM requires several environment variables to be configured. The Docker Compose setup above handles the database automatically, but you'll need to configure environment variables for the API and web services. See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for complete configuration instructions, including database setup for non-Docker deployments and advanced settings.

## Kubernetes Deployment

If you're running Kubernetes, we provide a comprehensive Helm chart. Check out the [Helm chart documentation](./charts/lumiapm/README.md) for detailed installation instructions, production configuration examples, TLS setup, and more.

## Development

Want to hack on Lumia.PM? See our [Environment Setup Guide](ENVIRONMENT_SETUP.md) for detailed instructions on configuring environment variables and troubleshooting common issues like CORS problems.

Quick start:
```bash
# Clone and install dependencies
git clone https://github.com/yuxelmurat/Lumia.PM.git
cd Lumia.PM
pnpm install

# Create a .env file in the root with required environment variables
# See ENVIRONMENT_SETUP.md for detailed instructions

# Start development servers
pnpm dev
```

For contributing guidelines, code structure, and development best practices, check out our [contributing guide](CONTRIBUTING.md).

## MCP Server

Lumia.PM ships a built-in HTTP MCP endpoint at `/api/mcp` so AI tools like Claude, Cursor, and other MCP clients can manage your tasks, projects, and labels. A stdio client package is also available on npm (`npx -y @kaneo/mcp`) — the package name is a legacy of this project's origins as a fork of [Kaneo](https://github.com/usekaneo/kaneo) and has not been republished under a new name.

## Community

- **[GitHub Issues](https://github.com/yuxelmurat/Lumia.PM/issues)** - Bug reports and feature requests
- **[Documentation](apps/docs)** - Setup guides and API docs
- **Email** - [help@lumiapm.com](mailto:help@lumiapm.com)

## Contributing

We're always looking for help, whether that's:
- Reporting bugs or suggesting features
- Improving documentation
- Contributing code

Check out [CONTRIBUTING.md](CONTRIBUTING.md) for the details on how to get involved.

## About

Lumia.PM is a product of Lumia.app, a software brand built by Murat Yüksel. Read more on the [about page](https://lumiapm.com/about).

This project started as a fork of [Kaneo](https://github.com/usekaneo/kaneo), an open source project management platform originally created by Andrej Acevski, under the MIT license. The `LICENSE` file's original copyright notice is preserved as required by that license; a handful of internal package names under the `@kaneo/*` npm scope (`packages/mcp`, `packages/planka-import`, and the workspace packages in `apps/`) are also unchanged, since renaming a published npm package or workspace scope is a breaking change on its own and out of scope for this rebrand.

## License

MIT License - see [LICENSE](LICENSE) for details.

<br />

---

<br />

<a id="turkce"></a>

# 🇹🇷 Türkçe

## Neden Lumia.PM?

İç mimarlık ve tasarım stüdyoları, projelerini yazılım ekipleri gibi yürütmez. Bir render birçok revizyon turundan geçer, müşterinin "gerçek" bir proje yönetim aracına hiç dokunmadan onay vermesi gerekir ve her stüdyonun, müşteriyle buluştuğu o anı kendi markasıyla taşımak istediği bir kimliği vardır.

Lumia.PM tam olarak bu iş akışı için tasarlandı: projelerinizi ve görevlerinizi ekibinizle iç ortamda planlayın, ardından markalı, müşteriye özel bir bağlantı paylaşın; müşteri render'ları inceleyebilsin, görselin belirli bir noktasına iğneli (pin) yorum bırakabilsin ve değişiklik talep edebilsin ya da onaylayabilsin — iç çalışma alanınızı hiç görmeden.

**Onu farklı kılan:**
- **Müşteri onayı yerleşik olarak gelir** — müşterinizin ihtiyaç duyduğu şey bir giriş değil, markalı bir bağlantıdır
- **Render'larda versiyon geçmişi** — sadece son yükleneni değil, her revizyonu görün
- **Sade arayüz**, aracın kendisi değil işiniz öne çıkar
- **Self-hosted (kendi sunucunuzda barındırılır)** — verileriniz size ait kalır
- **Açık kaynak**, izin verici MIT lisansıyla

## Lumia.PM neyin yerini alıyor?

Çoğu stüdyo bugün genel amaçlı bir görev panosunu (Trello, Asana, Monday.com...), render revizyonlarıyla dolu paylaşımlı bir sürücüyü, müşteri geri bildirimi için bir e-posta ya da WhatsApp yazışmasını ve FF&E/malzeme listesi için bir Excel dosyasını bir araya getirmeye çalışır. Lumia.PM bunların hepsini tek bir sisteme indirger:

| Şu anki hâli yerine... | Lumia.PM size şunu verir |
|---|---|
| `render_v1_final_v2_FINAL.jpg` dosyalarıyla dolu paylaşımlı bir sürücü | Yüklenen her görselde yerleşik versiyon geçmişi |
| Onay için render'ları e-posta ile ileri geri göndermek | Giriş gerektirmeyen, markalı, iğneli yorumlu ve onay aksiyonlu bir müşteri bağlantısı |
| Tasarım işine oturmayan genel bir kanban panosu | Stüdyo projelerine göre şekillenmiş board, backlog ve özel alanlar (custom fields) |
| Elle "temiz", filigranlı bir önizleme hazırlayıp tekrar göndermek | Müşteriyle paylaşılan görsellere otomatik filigran |
| Onayın tek bir kişinin hafızasında kalması | Görünür ve gerektiğinde sıfırlanabilir, çoklu onaylayıcılı iş akışları |
| Müşteri raporları için ayrı bir dışa aktarma aracı | Görevlerin ve proje durumunun yerleşik PDF olarak dışa aktarımı |

## Özellikler

**Görev ve proje yönetimi**
- Sürükle-bırak destekli kanban board, backlog ve liste görünümleri
- Proje başına özel alanlar (malzeme, oda, bütçe kalemi veya stüdyonuzun takip ettiği her şey)
- Yeni bir projenin stüdyonuzun standart kolon ve görevleriyle başlamasını sağlayan proje şablonları
- Öncelikler, teslim tarihleri, atananlar, etiketler ve toplu görev işlemleri
- Görev içe/dışa aktarma, müşteriye yönelik raporlar için PDF dışa aktarım dahil
- Görevlere karşı harcanan saatleri takip etmek için zaman kayıtları (time entries)

**Görsel ve render iş akışı**
- Tam versiyon geçmişiyle görsel yükleme — sadece son değil, her revizyon erişilebilir kalır
- Görselin belirli bir noktasına bağlı, muğlak bir yorum değil, iğne tabanlı (pin) doğrudan işaretleme
- Bir görevin görsellerine tek bakışta göz atmak için moodboard tarzı galeri görünümü
- Müşteri bağlantıları üzerinden paylaşılan görsellere otomatik uygulanan filigran

**Müşteri iş birliği**
- Müşterinizin hesap açmadan veya giriş yapmadan açabileceği markalı, herkese açık proje bağlantıları
- Müşteri erişiminin süresiz açık kalmaması için ayarlanabilir bağlantı geçerlilik süresi
- Birden fazla paydaşın onay vermesi gereken çoklu onaylayıcı kurulumları dahil, değişiklik talep edildiğinde görünür şekilde sıfırlanabilen görev onay iş akışı

**Ekip iş birliği**
- Her görev ve proje için threadli yorumlar ve aktivite akışı
- Kullanıcı bazlı teslimat tercihleriyle bildirimler
- Basit otomasyon için iş akışı kuralları (ör. durum değişikliğinin bir aksiyonu tetiklemesi)

**Entegrasyonlar ve genişletilebilirlik**
- Slack, Discord, Telegram, GitHub ve Gitea entegrasyonları
- Kendi araçlarınızı bağlamak için genel amaçlı giden webhook'lar
- Claude veya Cursor gibi yapay zekâ asistanlarının görevlerinizi ve projelerinizi doğrudan okuyup yönetebilmesi için yerleşik bir MCP (Model Context Protocol) uç noktası

**Güvenlik ve barındırma**
- Varsayılan olarak self-hosted — proje dosyalarınız ve müşteri verileriniz kendi altyapınızda kalır
- Sadece arayüzde gizlenen değil, API üzerinde uygulanan çalışma alanı bazlı roller ve izinler
- Kalıcı depolama için PostgreSQL; birden fazla API örneği çalıştırıyorsanız gerçek zamanlı iletim için opsiyonel Redis
- Daha basit Docker Compose seçeneğinin yanında Kubernetes dağıtımları için bir Helm chart'ı

## Lumia.PM rakiplerine göre nasıl?

Trello, Asana, Monday.com ve ClickUp olgun, genel amaçlı araçlar — daha büyük entegrasyon pazar yerleri, cilalı mobil uygulamaları var ve sadece genel bir panoya ihtiyacı olan ekipler için gayet mantıklılar. Bu genişlik gerçek ve Lumia.PM'in kazanmaya çalıştığı alan bu değil.

Lumia.PM bilinçli olarak dar bir alana odaklanıyor: bir stüdyonun her projede tekrar ettiği belirli teslim noktaları için tasarlandı — bir PM aracına giriş yapmayacak bir müşteriden render onayı almak, son revizyonun üzerine yazmak yerine her versiyonu saklamak ve iş ilerlemeden önce kimin onayladığını bilmek. Bunlar genel bir araçta hazır gelen özellikler değil; genelde ayrı bir e-imza aracı, paylaşımlı bir sürücü veya birinin güncellemeyi hatırlaması gereken bir checklist ile çözülür.

<!-- prettier-ignore -->
| Yetenek | Lumia.PM | Trello / Asana / Monday / ClickUp |
|:---|:---:|:---:|
| Girişsiz, markalı müşteri onay bağlantısı | ✅ | ⚠️ ücretli misafir koltuğu ya da 3. parti araç |
| Render üzerinde belirli bir noktaya iğneli geri bildirim | ✅ | ❌ |
| Yüklenen görsellerde versiyon geçmişi | ✅ | ❌ |
| Sıfırlanabilir, çoklu onaylayıcılı onay | ✅ | ⚠️ checklist ile taklit edilir |
| Müşteri paylaşımlarında otomatik filigran | ✅ | ❌ |
| Self-hosted, verinin sahibi siz | ✅ | ❌ yaygın planlarda sadece bulut |
| Açık kaynak (MIT) | ✅ | ❌ |
| Self-host'ta sınırsız ölçekte ücretsiz | ✅ | ❌ kullanıcı başı ücretlendirme |
| Yerleşik yapay zekâ araç erişimi (MCP) | ✅ | ⚠️ sınırlı/ücretli API |
| Mobil uygulamalar ve 3. parti entegrasyon pazarı | ⚠️ | ✅ |
| Stüdyo dışı ekipler için genel amaçlı pano | ⚠️ | ✅ |

✅ yerleşik &nbsp;·&nbsp; ⚠️ mümkün ama yerleşik değil &nbsp;·&nbsp; ❌ sunulmuyor

Ekibinizin ihtiyacı sadece Trello tarzı genel bir panoysa, bu araçların herhangi biri o işi gayet iyi görür — Lumia.PM'in kapatmaya çalıştığı boşluk bu değil. Lumia.PM, genel amaçlı araçların doğal olarak modellemediği render onayı, versiyon geçmişi ve müşteriye markalı paylaşım iş akışı için var.

## Kurulum ve Kullanım

### Docker Compose ile Hızlı Başlangıç

Lumia.PM'i denemenin en hızlı yolu Docker Compose'dur. Bu, Lumia.PM ve PostgreSQL'i tek bir birleşik container ile ayağa kaldırır:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env_file:
      - .env
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lumiapm -d lumiapm"]
      interval: 10s
      timeout: 5s
      retries: 5

  lumiapm:
    build:
      context: .
      dockerfile: Dockerfile.lumiapm
    ports:
      - "5173:5173"
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

Bunu `compose.yml` olarak kaydedin, `.env.sample` dosyasını `.env` olarak kopyalayın, `KANEO_CLIENT_URL=http://localhost:5173` satırının yorumunu kaldırın, `POSTGRES_PASSWORD=<şifre>` ve `AUTH_SECRET=<openssl rand -hex 32 çıktısı>` değerlerini ayarlayın, `docker compose up -d` komutunu çalıştırın ve [http://localhost:5173](http://localhost:5173) adresini açın.

Docker Compose içinde, birleşik container PostgreSQL'e `postgres` servis adı üzerinden ulaşır.
API'yi Compose içinde değil de kendi makinenizde çalıştırıyorsanız `localhost` kullanın veya `DATABASE_URL` değerini elle belirtin.

> **Not:** ortam değişkenleri hâlâ dahili olarak `KANEO_*` ön ekini kullanır (ör. `KANEO_CLIENT_URL`) — tam liste ve nedeni için [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) dosyasına bakın.

### İlk giriş

Uygulama ayağa kalktıktan sonra tarayıcınızda açın, ilk hesabı oluşturun (bu hesap çalışma alanının sahibi olur), stüdyonuz için bir çalışma alanı (workspace) oluşturun ve bir proje ekleyin. Proje ayarlarından, müşterilerinizle paylaşacağınız markalı herkese açık bağlantıyı oluşturabilirsiniz.

### Geliştirme Ortamı Kurulumu

Geliştirme için, ortam değişkenlerinin yapılandırılması ve CORS gibi yaygın sorunların giderilmesi hakkında ayrıntılı talimatlar içeren [Ortam Kurulum Rehberi](ENVIRONMENT_SETUP.md)'ne bakın.

### Yapılandırma

Lumia.PM'in çalışması için birkaç ortam değişkeninin ayarlanması gerekir. Yukarıdaki Docker Compose kurulumu veritabanını otomatik olarak halleder, ancak API ve web servisleri için ortam değişkenlerini yapılandırmanız gerekir. Docker dışı dağıtımlar için veritabanı kurulumu ve gelişmiş ayarlar dahil tam yapılandırma talimatları için [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) dosyasına bakın.

## Kubernetes Dağıtımı

Kubernetes kullanıyorsanız kapsamlı bir Helm chart'ı sunuyoruz. Ayrıntılı kurulum talimatları, production yapılandırma örnekleri, TLS kurulumu ve daha fazlası için [Helm chart dokümantasyonu](./charts/lumiapm/README.md)'na göz atın.

## Geliştirme

Lumia.PM üzerinde geliştirme mi yapmak istiyorsunuz? Ortam değişkenlerinin yapılandırılması ve CORS gibi yaygın sorunların giderilmesi hakkında ayrıntılı talimatlar için [Ortam Kurulum Rehberi](ENVIRONMENT_SETUP.md)'ne bakın.

Hızlı başlangıç:
```bash
# Depoyu klonlayın ve bağımlılıkları kurun
git clone https://github.com/yuxelmurat/Lumia.PM.git
cd Lumia.PM
pnpm install

# Kökte gerekli ortam değişkenlerini içeren bir .env dosyası oluşturun
# Ayrıntılı talimatlar için ENVIRONMENT_SETUP.md dosyasına bakın

# Geliştirme sunucularını başlatın
pnpm dev
```

Katkı sağlama yönergeleri, kod yapısı ve geliştirme en iyi uygulamaları için [katkı rehberimize](CONTRIBUTING.md) göz atın.

## MCP Sunucusu

Lumia.PM, Claude, Cursor ve diğer MCP istemcileri gibi yapay zekâ araçlarının görevlerinizi, projelerinizi ve etiketlerinizi yönetebilmesi için `/api/mcp` adresinde yerleşik bir HTTP MCP uç noktası sunar. npm üzerinde bir stdio istemci paketi de mevcuttur (`npx -y @kaneo/mcp`) — paket adı, bu projenin [Kaneo](https://github.com/usekaneo/kaneo)'dan fork'lanmış geçmişinin bir kalıntısıdır ve yeni bir isim altında yeniden yayınlanmamıştır.

## Topluluk

- **[GitHub Issues](https://github.com/yuxelmurat/Lumia.PM/issues)** - Hata bildirimleri ve özellik talepleri
- **[Dokümantasyon](apps/docs)** - Kurulum rehberleri ve API dokümanları
- **E-posta** - [help@lumiapm.com](mailto:help@lumiapm.com)

## Katkıda Bulunma

Her zaman yardıma açığız, ister:
- Hata bildirmek veya özellik önermek
- Dokümantasyonu iyileştirmek
- Kod katkısında bulunmak

olsun. Nasıl dahil olabileceğinizin ayrıntıları için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasına göz atın.

## Hakkında

Lumia.PM, Murat Yüksel tarafından kurulan bir yazılım markası olan Lumia.app'in bir ürünüdür. Daha fazlası için [hakkında sayfasına](https://lumiapm.com/about) göz atabilirsiniz.

Bu proje, MIT lisansı altında Andrej Acevski tarafından oluşturulan açık kaynaklı bir proje yönetim platformu olan [Kaneo](https://github.com/usekaneo/kaneo)'nun fork'u olarak başladı. `LICENSE` dosyasındaki orijinal telif hakkı bildirimi, o lisansın gerektirdiği şekilde korunmaktadır; `@kaneo/*` npm kapsamı altındaki bazı dahili paket adları da (`packages/mcp`, `packages/planka-import` ve `apps/` altındaki workspace paketleri) değiştirilmemiştir, çünkü yayınlanmış bir npm paketini veya workspace kapsamını yeniden adlandırmak tek başına yıkıcı (breaking) bir değişikliktir ve bu rebrand'in kapsamı dışındadır.

## Lisans

MIT Lisansı - ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.

---

<p align="center">
  Built with ❤️ by <a href="https://lumiapm.com/about">Murat Yüksel</a> and <a href="https://github.com/yuxelmurat/Lumia.PM/graphs/contributors">contributors</a>
</p>
