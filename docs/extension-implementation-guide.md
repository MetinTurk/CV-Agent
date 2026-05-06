# Browser Extension Implementation Guide

Bu doküman, CV Agent uygulamasına tarayıcı eklentisi eklenirken agent tarafından referans alınacak teknik rehberdir. Amaç; kullanıcının bir iş ilanı sayfasındayken eklentiyi açıp ilan bilgisini toplaması, bu verinin kullanıcının kayıtlı profil nitelikleriyle karşılaştırılması ve sonucun web uygulamasındaki analiz/CV özelleştirme akışına bağlanmasıdır.

## Ürün Bağlamı

Tasarım setinde uygulama şu ana deneyimleri içeriyor:

- Giriş ve kayıt ekranları.
- Profil/onboarding chatbot deneyimi.
- Profil paneli, proje ve sertifika görünümü.
- Geçmiş başvurular ve başvuru detayları.
- İş ilanı analizi ekranı.
- Yeni analiz başlatma rehberi.
- Tarayıcı eklentisi popup'ı.
- Belge yükleme arayüzü.
- CV özelleştirme sihirbazı.
- ATS kontrol modalı.

Eklenti bu deneyimlerin merkezindeki "iş ilanı yakala ve analiz başlat" köprüsüdür. Eklenti kendisi AI kararı üretmez; sayfadan ham/yarı yapılandırılmış ilan bilgisini toplar, backend'e gönderir ve web uygulamasındaki analiz sonucuna yönlendirir.

## Hedef Teknoloji Kararı

Backend artık FastAPI değil, ElysiaJS olarak tasarlanmalıdır.

Hedef server yaklaşımı:

- Runtime: Bun.
- Framework: ElysiaJS.
- Dil: TypeScript.
- Validation: Elysia `t` / TypeBox.
- Auth: JWT veya Better Auth uyumlu session mimarisi.
- API istemcisi: Web ve extension tarafında tercihen paylaşılan typed client veya Eden Treaty.
- AI çağrıları: Sadece server içinde.
- Extension: Chrome Manifest V3, TypeScript, React popup, Vite build.

ElysiaJS referans noktaları:

- Elysia quick start ve route yapısı: `https://elysiajs.com/quick-start.md`
- Validation ve `t.Object`: `https://elysiajs.com/essential/validation.md`
- CORS plugin: `https://elysiajs.com/plugins/cors.md`
- JWT plugin: `https://elysiajs.com/plugins/jwt.md`
- Eden Treaty typed client: `https://elysiajs.com/eden/treaty/overview.md`

## Monorepo Hedef Yapısı

Mevcut workspace pattern'i `apps/*` ve `packages/*` üzerinden ilerliyor. Eklenti eklenirken önerilen hedef yapı:

```text
.
├── apps/
│   ├── web/
│   ├── server/
│   │   ├── src/
│   │   │   ├── app.ts
│   │   │   ├── index.ts
│   │   │   ├── config/
│   │   │   ├── plugins/
│   │   │   ├── routes/
│   │   │   ├── schemas/
│   │   │   ├── services/
│   │   │   └── repositories/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── chrome-extension/
│       ├── manifest.json
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── src/
│           ├── background/
│           ├── content/
│           ├── popup/
│           ├── lib/
│           └── types/
├── packages/
│   ├── ui/
│   └── shared/
│       └── src/
│           ├── api/
│           ├── schemas/
│           └── types/
```

`packages/shared` zorunlu değildir ama önerilir. Web, server ve extension arasında iş ilanı, analiz, profil ve auth tiplerini paylaşmak için temiz bir sınır sağlar.

## Eklenti Sorumlulukları

Extension sadece şu işleri yapmalıdır:

1. Aktif sekmenin desteklenen bir iş ilanı sayfası olup olmadığını anlamak.
2. Kullanıcının açık aksiyonu ile ilan bilgisini toplamak.
3. Kullanıcının auth durumunu kontrol etmek.
4. Toplanan veriyi backend'e göndermek.
5. Analiz başladı/tamamlandı durumunu kullanıcıya göstermek.
6. Backend'in verdiği analiz URL'ine web uygulamasını açmak.

Extension şu işleri yapmamalıdır:

- AI model çağrısı yapmak.
- Gemini/OpenAI/Anthropic API key saklamak.
- Kullanıcı profiliyle karşılaştırmayı client tarafında yapmak.
- Tüm sayfa gezintilerini sürekli takip etmek.
- Kullanıcı tıklamadan iş ilanı içeriğini backend'e göndermek.

## Extension Hedef Dosya Yapısı

```text
apps/chrome-extension/
├── manifest.json
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── background/
    │   ├── service-worker.ts
    │   └── message-router.ts
    ├── content/
    │   ├── content-script.ts
    │   ├── extract-current-page.ts
    │   └── extractors/
    │       ├── generic-json-ld.ts
    │       ├── linkedin.ts
    │       ├── kariyer-net.ts
    │       └── fallback-readable-text.ts
    ├── popup/
    │   ├── popup.html
    │   ├── popup.tsx
    │   ├── popup-app.tsx
    │   └── popup.css
    ├── lib/
    │   ├── api-client.ts
    │   ├── auth-storage.ts
    │   ├── chrome-messaging.ts
    │   ├── env.ts
    │   └── normalize-job-posting.ts
    └── types/
        ├── chrome-messages.ts
        └── job-posting.ts
```

Her `.ts` ve `.tsx` dosyasının başında kısa modül sorumluluğu yorumu bulunmalıdır.

## Manifest V3 Gereksinimleri

Minimum manifest:

```json
{
  "manifest_version": 3,
  "name": "Career Co-pilot",
  "version": "0.1.0",
  "description": "İş ilanlarını CV Agent profiliyle analiz eder.",
  "action": {
    "default_popup": "popup/popup.html"
  },
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "permissions": ["activeTab", "scripting", "storage", "tabs"],
  "host_permissions": [
    "http://localhost:5173/*",
    "http://localhost:3000/*",
    "https://www.linkedin.com/jobs/*",
    "https://www.kariyer.net/*",
    "https://*.indeed.com/*"
  ]
}
```

Production'da `localhost` izinleri kaldırılmalı, web ve API domainleri açık yazılmalıdır.

## Kullanıcı Akışı

Ana akış:

1. Kullanıcı web uygulamasında kayıt olur veya giriş yapar.
2. Kullanıcı profil chatbot ile temel niteliklerini tamamlar.
3. Kullanıcı bir iş ilanı sayfasına gider.
4. Kullanıcı extension popup'ını açar.
5. Popup desteklenen sayfa durumunu gösterir.
6. Kullanıcı `İş İlanını Analiz Et` butonuna tıklar.
7. Popup, content script'e `EXTRACT_JOB_POSTING` mesajı gönderir.
8. Content script iş ilanı bilgisini çıkarır.
9. Background service worker, `POST /api/job-analyses` çağrısı yapar.
10. Backend kullanıcı profilini ve iş ilanını analiz eder.
11. Backend `analysisId` ve `redirectUrl` döner.
12. Extension `redirectUrl` adresini yeni sekmede açar.

## Popup UI Durumları

Tasarım diline göre popup sade, yoğun ve aksiyon odaklı olmalıdır.

Gerekli state'ler:

- `unauthenticated`: Giriş yapma veya web uygulamasına yönlendirme.
- `unsupported-page`: Bu sayfada iş ilanı algılanamadı.
- `ready`: İlan bilgisi toplanabilir.
- `extracting`: Sayfadan ilan bilgisi alınıyor.
- `analyzing`: Backend analizi başlatıldı.
- `success`: Analiz tamamlandı, web uygulamasına yönlendiriliyor.
- `error`: Açık hata mesajı ve tekrar dene aksiyonu.

Popup metinleri Türkçe karakterli olmalıdır:

- `İş İlanı Bilgisi Topla`
- `İş İlanını Analiz Et`
- `Bu sayfada desteklenen bir iş ilanı algılanamadı.`
- `Analiz hazırlanıyor...`
- `Analiz sayfasına yönlendiriliyorsunuz.`

## İş İlanı Çıkarma Stratejisi

Extractor katmanlı çalışmalıdır.

Öncelik sırası:

1. `application/ld+json` içindeki schema.org `JobPosting`.
2. Open Graph ve meta tag verileri.
3. Desteklenen sitelere özel DOM selector'ları.
4. Fallback: ana içerikten temizlenmiş okunabilir metin.

Normalize edilmiş hedef model:

```ts
export type ExtractedJobPosting = {
  sourceUrl: string
  sourceSite: "linkedin" | "kariyer-net" | "indeed" | "generic"
  title: string | null
  companyName: string | null
  location: string | null
  employmentType: string | null
  workplaceType: "remote" | "hybrid" | "onsite" | "unknown"
  descriptionText: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  seniority: string | null
  language: "tr" | "en" | "unknown"
  extractedAt: string
}
```

Minimum validasyon:

- `sourceUrl` boş olmamalı.
- `descriptionText` en az 200 karakter olmalı.
- `title` veya `companyName` yoksa popup kullanıcıya düşük güven uyarısı göstermeli.

## Chrome Messaging Sözleşmesi

Content script, popup ve background arasında discriminated union kullanılmalıdır.

```ts
export type ExtensionRequest =
  | { type: "GET_ACTIVE_TAB_STATUS" }
  | { type: "EXTRACT_JOB_POSTING" }
  | { type: "START_JOB_ANALYSIS"; payload: ExtractedJobPosting }
  | { type: "GET_AUTH_STATUS" }
  | { type: "LOG_OUT" }

export type ExtensionResponse =
  | { ok: true; type: "JOB_POSTING_EXTRACTED"; payload: ExtractedJobPosting }
  | { ok: true; type: "JOB_ANALYSIS_STARTED"; payload: JobAnalysisStartResponse }
  | { ok: true; type: "AUTH_STATUS"; payload: AuthStatus }
  | { ok: false; errorCode: string; message: string }
```

Tüm mesaj handler'ları unknown input'u doğrulamalı, doğrudan cast yapmamalıdır.

## Auth Stratejisi

Başlangıç için extension içinde ayrı auth storage kullanılmalıdır.

Seçenekler:

1. Popup içinde giriş formu:
   - `POST /api/auth/login`
   - JWT `chrome.storage.local` veya `chrome.storage.session` içine yazılır.
2. Web uygulamasına yönlendirme:
   - Kullanıcı web'de giriş yapar.
   - Sonraki fazda web-extension token bridge kurulabilir.

MVP için öneri:

- Popup içinde "Web uygulamasında giriş yap" butonu.
- Giriş sonrası extension için kısa ömürlü token exchange endpoint'i.
- Token `chrome.storage.session` içinde tutulur.

Güvenlik:

- JWT localStorage'dan kopyalanmaya çalışılmamalı.
- Token hiçbir log'a yazılmamalı.
- API key extension içine konulmamalı.
- Kullanıcı explicit `Analiz Et` demeden ilan verisi backend'e gönderilmemeli.

## ElysiaJS Backend Hedef Modülleri

Elysia server yapısı şu sorumluluklara ayrılmalıdır:

```text
apps/server/src/
├── index.ts
├── app.ts
├── config/
│   └── env.ts
├── plugins/
│   ├── cors.ts
│   ├── auth.ts
│   └── error-handler.ts
├── routes/
│   ├── health.route.ts
│   ├── auth.route.ts
│   ├── profile.route.ts
│   ├── job-analyses.route.ts
│   ├── documents.route.ts
│   └── cv-generation.route.ts
├── schemas/
│   ├── auth.schema.ts
│   ├── profile.schema.ts
│   ├── job-posting.schema.ts
│   ├── job-analysis.schema.ts
│   └── cv.schema.ts
├── services/
│   ├── auth.service.ts
│   ├── profile.service.ts
│   ├── job-analysis.service.ts
│   ├── job-posting-parser.service.ts
│   ├── cv-generation.service.ts
│   └── ats-check.service.ts
└── repositories/
    ├── user.repository.ts
    ├── profile.repository.ts
    ├── job-analysis.repository.ts
    └── document.repository.ts
```

## ElysiaJS API Sözleşmeleri

### Health

```http
GET /api/health
```

Response:

```json
{
  "status": "ok",
  "service": "CV Agent API",
  "version": "0.1.0",
  "environment": "development"
}
```

### Auth

```http
POST /api/auth/login
GET /api/auth/me
POST /api/auth/logout
```

Extension ve web aynı auth modelini kullanmalıdır.

### Profil

```http
GET /api/profile/me
PATCH /api/profile/me
POST /api/profile/chat/message
```

Profil verisi kullanıcı nitelikleri için tek kaynak olmalıdır:

- ad soyad
- lokasyon
- yetenekler
- projeler
- sertifikalar
- diller
- iş deneyimleri
- eğitim
- belgeler

### İş İlanı Analizi

```http
POST /api/job-analyses
GET /api/job-analyses
GET /api/job-analyses/:analysisId
```

`POST /api/job-analyses` request:

```ts
export type CreateJobAnalysisRequest = {
  jobPosting: ExtractedJobPosting
  source: {
    kind: "chrome-extension"
    extensionVersion: string
    tabId?: number
  }
}
```

Response:

```ts
export type CreateJobAnalysisResponse = {
  analysisId: string
  status: "queued" | "processing" | "completed"
  redirectUrl: string
}
```

Analiz detay response:

```ts
export type JobAnalysisDetail = {
  id: string
  jobPosting: ExtractedJobPosting
  companyName: string | null
  title: string | null
  compatibilityScore: number
  decision: "apply" | "consider" | "skip"
  strengths: AnalysisInsight[]
  improvementAreas: AnalysisInsight[]
  missingRequirements: AnalysisInsight[]
  recommendations: string[]
  createdAt: string
}
```

### CV Özelleştirme

```http
POST /api/job-analyses/:analysisId/cv-drafts
GET /api/cv-drafts/:draftId
PATCH /api/cv-drafts/:draftId
POST /api/cv-drafts/:draftId/ats-check
```

Bu endpoint'ler CV özelleştirme sihirbazı ve ATS kontrol modalı için kullanılmalıdır.

## Elysia Validation Örneği

Agent uygulama yaparken request/response sözleşmelerini Elysia `t` ile doğrulamalıdır.

```ts
import { Elysia, t } from "elysia"

export const jobPostingSchema = t.Object({
  sourceUrl: t.String({ format: "uri" }),
  sourceSite: t.Union([
    t.Literal("linkedin"),
    t.Literal("kariyer-net"),
    t.Literal("indeed"),
    t.Literal("generic"),
  ]),
  title: t.Nullable(t.String()),
  companyName: t.Nullable(t.String()),
  location: t.Nullable(t.String()),
  employmentType: t.Nullable(t.String()),
  workplaceType: t.Union([
    t.Literal("remote"),
    t.Literal("hybrid"),
    t.Literal("onsite"),
    t.Literal("unknown"),
  ]),
  descriptionText: t.String({ minLength: 200 }),
  requirements: t.Array(t.String()),
  responsibilities: t.Array(t.String()),
  benefits: t.Array(t.String()),
  seniority: t.Nullable(t.String()),
  language: t.Union([t.Literal("tr"), t.Literal("en"), t.Literal("unknown")]),
  extractedAt: t.String(),
})
```

Route örneği:

```ts
new Elysia({ prefix: "/api/job-analyses" })
  .post(
    "/",
    async ({ body, user, status }) => {
      const result = await jobAnalysisService.create({
        userId: user.id,
        jobPosting: body.jobPosting,
        source: body.source,
      })

      return status(201, result)
    },
    {
      auth: true,
      body: t.Object({
        jobPosting: jobPostingSchema,
        source: t.Object({
          kind: t.Literal("chrome-extension"),
          extensionVersion: t.String(),
          tabId: t.Optional(t.Number()),
        }),
      }),
    }
  )
```

## CORS ve Extension Origin

Development CORS origin'leri:

```text
http://localhost:5173
http://127.0.0.1:5173
chrome-extension://<development-extension-id>
```

Production'da:

```text
https://app.<domain>
chrome-extension://<published-extension-id>
```

Elysia CORS plugin server başlangıcında merkezi konfigürasyondan beslenmelidir. Extension id build ortamına göre `.env` üzerinden verilmelidir.

## AI Analiz Pipeline

Backend analizi şu adımlarla çalışmalıdır:

1. Request auth doğrulaması.
2. İş ilanı payload validasyonu.
3. Kullanıcının güncel profilinin yüklenmesi.
4. Profil eksikse analiz yerine `profile_incomplete` durumuyla rehber response.
5. İş ilanı metninin normalize edilmesi.
6. LLM ile yapılandırılmış gereksinim çıkarımı.
7. Kullanıcı nitelikleriyle karşılaştırma.
8. Skor, güçlü yön, geliştirilebilir yön, eksik yön ve öneri üretimi.
9. Analiz kaydı oluşturma.
10. Web redirect URL üretme.

LLM çıktıları mutlaka schema ile doğrulanmalıdır. Hatalı JSON veya eksik alanlarda retry/fallback stratejisi olmalıdır.

## Web Uygulaması Entegrasyonu

Extension analiz oluşturduktan sonra web tarafında şu route'lar hedeflenmelidir:

```text
/analizler
/analizler/:analysisId
/analizler/:analysisId/cv-olustur
/cv-taslaklari/:draftId
```

Tasarım setindeki ekran karşılıkları:

- İş ilanı analizi: `/analizler/:analysisId`
- Başvuru detayları: `/basvurular/:applicationId`
- CV özelleştirme sihirbazı: `/analizler/:analysisId/cv-olustur`
- ATS kontrol modalı: CV draft ekranı içinde modal
- Belge yükleme: `/belgeler`
- Projelerim: `/projeler`

## UI Dil ve Tasarım Kuralları

Extension popup, web uygulamasıyla aynı ürün dilini taşımalıdır:

- Ürün adı: `Career Co-pilot` veya Türkçe ekranlarda `Kariyer Yardımcı Pilotu`.
- Ana aksiyon: mavi primary buton.
- İkonlar: lucide.
- Layout: küçük popup içinde kart/card içinde kart kullanılmamalı.
- Metinler kısa ve aksiyon odaklı olmalı.
- Türkçe ekranlarda Türkçe karakter kullanılmalı.
- Hata mesajları kullanıcıya yapılacak aksiyonu söylemeli.

Popup ilk MVP metinleri:

```text
İş İlanı Bilgisi Topla
Şu an görüntülediğiniz sayfadaki iş ilanı detaylarını, gereksinimleri ve nitelikleri yapay zeka ile analiz etmek için toplayacağız.
İş İlanını Analiz Et
```

## Belge ve Proje Bağlantısı

Analiz kalitesi için profil kaynakları şu şekilde modellenmelidir:

- Projeler: kullanıcı yeteneklerini somut örneklerle kanıtlar.
- Sertifikalar/belgeler: ATS ve nitelik eşleşmesini güçlendirir.
- CV taslakları: iş ilanına özel optimize edilir.
- GitHub senkronizasyonu: projeler ekranında ayrı entegrasyon olarak ele alınabilir.

Extension doğrudan belge yüklememeli; belge yükleme web uygulamasındaki modal/ekran üzerinden yapılmalıdır. Popup, profil veya belge eksikliği tespit edilirse kullanıcıyı ilgili web sayfasına yönlendirmelidir.

## Local Development Komutları

Hedef Elysia server için:

```bash
cd apps/server
bun install
bun run dev
```

Hedef extension için:

```bash
cd apps/chrome-extension
pnpm install
pnpm dev
pnpm build
```

Chrome'da local yükleme:

1. `chrome://extensions` açılır.
2. Developer Mode aktif edilir.
3. `Load unpacked` seçilir.
4. `apps/chrome-extension/dist` klasörü seçilir.

## Test ve Doğrulama

Extension testleri:

- Popup desteklenen sayfada `ready` durumuna geçiyor.
- Desteklenmeyen sayfada açık uyarı gösteriyor.
- JSON-LD `JobPosting` parse ediliyor.
- Fallback extractor boş metni valid payload olarak göndermiyor.
- Token yokken analiz endpoint'i çağrılmıyor.
- Backend 401/403/422/500 hataları kullanıcı dostu gösteriliyor.
- Başarılı analizde web redirect açılıyor.

Server testleri:

- `POST /api/job-analyses` auth gerektiriyor.
- Invalid job posting payload 422 dönüyor.
- Profil eksikse yönlendirici response dönüyor.
- LLM çıktısı schema doğrulamasından geçiyor.
- Analiz sonucu skor ve insight listeleriyle kaydediliyor.

Web testleri:

- Analiz detay sayfası skor, yeterli yönler, geliştirilebilir yönler, eksik yönler ve önerileri gösteriyor.
- CV özelleştirme akışı analizden başlatılıyor.
- ATS kontrol modalı draft üzerinden açılıyor.

## Implementation Sırası

Agent'a "extension oluştur" denildiğinde önerilen uygulama sırası:

1. `apps/chrome-extension` scaffold oluştur.
2. Manifest V3 ve Vite React popup build ayarla.
3. Shared job posting tiplerini oluştur.
4. Chrome messaging sözleşmesini ekle.
5. Generic JSON-LD extractor yaz.
6. Popup state machine'i kur.
7. Auth storage ve API client ekle.
8. Elysia backend'de `job-analyses` route/schemas/service ekle.
9. CORS'a extension origin desteği ekle.
10. Web'de analiz detay route'unu bağla.
11. Başarılı analiz sonrası redirect akışını tamamla.
12. LinkedIn veya Kariyer.net için ilk site-specific extractor ekle.
13. Build, typecheck ve manuel Chrome testlerini tamamla.

## Kapsam Dışı Tutulacaklar

İlk extension MVP'sinde şunlar yapılmamalıdır:

- Birden fazla tarayıcı desteği.
- Otomatik arka plan tarama.
- Kullanıcı aksiyonu olmadan veri gönderimi.
- Extension içinde AI prompt/model çağrısı.
- Extension içinde CV PDF üretimi.
- Tüm iş ilanı siteleri için geniş extractor kapsamı.

## Kabul Kriterleri

- Extension Chrome MV3 olarak build ediliyor.
- Popup web tasarımlarındaki ürün diliyle uyumlu.
- Desteklenen iş ilanı sayfasından normalize edilmiş payload çıkarılıyor.
- Payload Elysia backend tarafından schema ile doğrulanıyor.
- Auth yoksa kullanıcı yönlendiriliyor veya giriş akışı gösteriliyor.
- Analiz başarıyla oluşturulunca web uygulamasındaki analiz detay sayfası açılıyor.
- AI/API key hiçbir client bundle içinde yer almıyor.
- TypeScript strict uyumlu.
- `pnpm typecheck` ve ilgili extension build komutu başarılı.

