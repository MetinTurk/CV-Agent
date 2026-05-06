# SERVER_ARCHITECTURE.md

## Amac

Bu dokuman, CV Agent server mimarisinin sorumluluklarini, modul sinirlarini ve AI/agent katmaninin nasil konumlanacagini tanimlar.

CV Agent server'in temel gorevi kullanicinin profil bilgisini toplamak, bu bilgiyi is ilani detaylariyla karsilastirmak, analiz sonucunu yapilandirilmis olarak uretmek ve ilana ozel ATS uyumlu CV uretim surecini yonetmektir.

## Ana Mimari Kararlari

### Runtime ve API Katmani

Server uygulamasi Bun uzerinde calisan ElysiaJS uygulamasidir. API katmani TypeScript-first ilerler; route sozlesmeleri Elysia `t` / TypeBox semalariyla tanimlanir.

Elysia katmani yalnizca HTTP sozlesmelerinden, auth/session baglamindan, request dogrulamadan, response semalarindan ve servis cagrilarindan sorumludur. Agent workflow, veritabani erisimi ve domain kurallari route dosyalarina gomulmez.

Mevcut versionless API sozlesmeleri:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/profile`
- `POST /api/profile-chat/message`
- `POST /api/profile-chat/document` (multipart DOCX yukleme)
- `POST /api/job-analyses`
- `POST /api/cv-generations`

Bagimlilik enjeksiyonu `apps/server/src/app.ts` icindeki `createApp(settings)` fonksiyonunda yapilir; route fabrikalari servis ornekleriyle birlikte `/api` grubu altinda monte edilir.

### Veri Katmani

Kalici veri icin PostgreSQL kullanilir. ORM katmani Drizzle ORM'dir.

Drizzle sorumluluklari:

- Tablo semalarini `apps/server/src/db/schema.ts` icinde tipli tutmak.
- Migration dosyalarini `apps/server/drizzle/` altinda uretmek.
- Repository katmanina tip guvenli query API'si vermek.

Mevcut tablolar:

- `users`: kimlik, email, ad/soyad, password hash.
- `profiles`: `users.id` ile birebir; profil verisi `data` JSONB sutununda saklanir.
- `job_analyses`: kullaniciya ait is ilani analizleri; ham metin, structured `job_description` ve isteğe bağlı `match_analysis` JSONB sutunlarinda tutulur.

Repository dosyalari SQL/ORM detayini route ve agent katmanindan saklar. Transaction sinirlari use-case ihtiyacina gore service katmaninda netlestirilir.

### AI ve Agent Katmani

LLM cagrilari her domain icin ayri bir **agent client** sinifina kapsullenir. Servis (use-case orkestrasyonu) ile agent client (provider iletisimi + structured output dogrulama) sorumluluklari ayrilir.

Mevcut agent client'lar:

- `ProfileAgentClient`: profil toplama sohbet asistani.
- `JobAnalysisAgentClient`: URL'den `JobDescription` ve profil/ilan eslesmesinden `MatchAnalysis` uretir.
- `CvGenerationAgentClient`: profil + `JobDescription` girdisinden `TailoredCv` uretir.

Agent client'larin tumu Groq Chat Completions API'sini kullanir; model, timeout ve retry sayisi `Settings` uzerinden enjekte edilir (`AGENT_MODEL`, `AGENT_REQUEST_TIMEOUT_SECONDS`, `AGENT_MAX_RETRIES`, `GROQ_API_KEY`).

Agent katmani prensipleri:

- Agent ciktisi guvenilir kabul edilmez; TypeBox veya domain semalariyla dogrulanir, eksik alanlar profil ya da default'lardan tamamlanir.
- Agent client'lar veritabanina dogrudan yazmaz; kalici yazi islemleri service/repository katmani uzerinden yapilir.
- `response_format: { type: "json_object" }` ile structured cikti istenir; ek olarak runtime parser saglam JSON ayikla/normalize eder.
- Hata sinifi ayrilir: `*AgentConfigurationError` (env eksik, 500) ve `*AgentRequestError` (provider hatasi, 502).
- Tool'lar (eklendiginde) dar kapsamli, tipli ve yetki kontrollu olur.
- Uzun suren analiz ve CV uretimi ileride queue/job modeline alinabilir.

### Harici Kaynak Cikarimi

LinkedIn URL'leri ve DOCX dosyalari `ProfileSourceService` ile ham metne donusturulur. Bu servis HTTP ya da DOCX kaynagindan metni cikarir, normalize eder ve `MAX_SOURCE_TEXT_LENGTH` sinirinda kirpip dondurür. Agent'a verilen icerik daima veri girdisi olarak isaretlenir; sistem talimati gibi yorumlanmaz.

## Klasor Yapisi

```text
apps/server/
+-- src/
|   +-- api/
|   |   +-- auth.ts
|   |   +-- cv-generation.ts
|   |   +-- health.ts
|   |   +-- job-analysis.ts
|   |   +-- profile.ts
|   |   +-- profile-chat.ts
|   +-- core/
|   |   +-- config.ts
|   |   +-- security.ts
|   +-- db/
|   |   +-- client.ts
|   |   +-- schema.ts
|   |   +-- repositories/
|   |       +-- job-analyses.ts
|   |       +-- profiles.ts
|   |       +-- users.ts
|   +-- schemas/
|   |   +-- auth.ts
|   |   +-- cv-generation.ts
|   |   +-- error.ts
|   |   +-- health.ts
|   |   +-- job-analysis.ts
|   |   +-- profile.ts
|   |   +-- profile-chat.ts
|   +-- services/
|   |   +-- auth-service.ts
|   |   +-- cv-generation-agent-client.ts
|   |   +-- cv-generation-service.ts
|   |   +-- job-analysis-agent-client.ts
|   |   +-- job-analysis-service.ts
|   |   +-- profile-agent-client.ts
|   |   +-- profile-chat-service.ts
|   |   +-- profile-source-service.ts
|   +-- app.ts
|   +-- index.ts
+-- drizzle/
+-- tests/
+-- drizzle.config.ts
+-- package.json
+-- tsconfig.json
```

## Modul Sorumluluklari

### API Routes

Route dosyalari HTTP sozlesmesini temsil eder.

Route sorumluluklari:

- Request body, header ve path/query parametrelerini almak.
- TypeBox/Elysia semalariyla validation yapmak.
- Auth/session baglamindan `user` kaydini almak (`AuthService.authenticateAuthorizationHeader`).
- Ilgili servis fonksiyonunu cagirmak.
- Domain hata siniflarini HTTP statuslerine cevirmek.
- Tipli response dondurmek.

Route dosyalari prompt olusturmaz, agent state yonetmez, veritabani query detaylarini bilmez ve CV/analiz domain kurallarini kendi icinde barindirmaz.

### Services

Service katmani use-case seviyesindeki is akisini yonetir.

Mevcut servisler:

- `AuthService`: kayit, login, JWT uretimi ve bearer token ile kullanici dogrulama.
- `ProfileChatService`: profil toplama sohbeti icin oturum state'i, profil patch cikarma, merge ve eksik alan hesabi; opsiyonel kaynak metniyle (URL/DOCX) baglam zenginlestirir.
- `ProfileSourceService`: URL ya da DOCX kaynagindan profil metni cikarir.
- `JobAnalysisService`: URL'den ilan metnini cekip `JobDescription` uretir, kullanicinin profili varsa `MatchAnalysis` ekler ve sonucu `job_analyses` tablosuna yazar.
- `CvGenerationService`: kullanicinin kayitli profili ve istemciden gelen `JobDescription` ile `TailoredCv` uretir (su anda response olarak doner; persist asamasi henuz tanimli degil).

### Schemas

API request/response sozlesmeleri TypeBox/Elysia `t` ile tanimlanir. TypeScript tipleri bu semalardan veya ilgili domain modellerinden turetilir.

Kritik model aileleri:

- `UserResponse`, `AuthResponse`
- `ProfileData`, `ProfileChatResponse`, `ProfileSourceContext`
- `JobDescription`, `MatchAnalysis`, `JobAnalysisResponse`
- `TailoredCv`, `CvGenerationResponse`

### Repositories

Repository katmani Drizzle ORM erisimini soyutlar.

Repository prensipleri:

- ORM detaylari route veya agent dosyalarina sizmaz.
- Her repository tek aggregate veya tablo grubu uzerinden calisir (`UserRepository`, `ProfileRepository`, `JobAnalysisRepository`).
- Repository metotlari domain servislerinin ihtiyaci kadar dar tutulur.

## Temel Veri Akislari

### Auth

```text
Web -> POST /api/auth/register
    -> AuthService
    -> UserRepository
    -> Drizzle/PostgreSQL users tablosu
    -> JWT + user response
```

```text
Web -> GET /api/auth/me
    -> AuthService bearer token dogrulama
    -> UserRepository
    -> user response
```

### Chatbot ile Profil Toplama

```text
Web -> POST /api/profile-chat/message
    -> AuthService bearer token dogrulama
    -> ProfileSourceService (varsa URL kaynagi)
    -> ProfileChatService
    -> conversation state yuklenir
    -> ProfileAgentClient cagrisi (LLM)
    -> profil patch'i normalize edilir / dogrulanir
    -> ProfileRepository upsert
    -> eksik zorunlu alanlar hesaplanir
    -> chatbot response doner
```

DOCX yuklemesi icin `POST /api/profile-chat/document` ayni service'i kullanir; tek fark kaynak ekstraksiyonunun multipart `document` alanindan yapilmasidir.

Response yalnizca serbest metin degildir. UI'in karar verebilmesi icin yapilandirilmis alanlar da doner:

- `reply`
- `session_id`
- `profile`
- `missing_required_fields`
- `is_profile_ready`

### Is Ilani Analizi

```text
Web -> POST /api/job-analyses
    -> AuthService bearer token dogrulama
    -> JobAnalysisService
    -> ProfileSourceService URL'den ham metni cikarir
    -> JobAnalysisAgentClient.generateJobDescription -> JobDescription
    -> ProfileRepository profil yuklenir
    -> JobAnalysisAgentClient.generateMatchAnalysis -> MatchAnalysis (best-effort)
    -> JobAnalysisRepository.create
    -> JobAnalysisResponse doner
```

### Ilana Ozel CV Uretimi

```text
Web -> POST /api/cv-generations
    -> AuthService bearer token dogrulama
    -> CvGenerationService
    -> ProfileRepository profil yuklenir (yoksa bos profil)
    -> CvGenerationAgentClient.generateTailoredCv -> TailoredCv
    -> CvGenerationResponse doner
```

## Structured Output ve Dogrulama

LLM ciktisi guvenilir kabul edilmez.

Kurallar:

- Agent'lardan beklenen her kritik cikti TypeBox/domain semasi ile tanimlanir.
- Agent client parser'lari eksik veya beklenmeyen alanlari tolere edip default/profil verisinden tamamlar; tamamen bozuk yanitlar `*AgentRequestError` ile yukselir.
- Provider hatalarinda `agentMaxRetries` kadar retry uygulanir; sonrasinda kontrollu hata mesaji doner.
- Veritabanina yazilan yapilandirilmis LLM ciktisi once normalize edilir.
- UI'a giden response modelleri domain modellerinden ayri tutulabilir.
- Kullaniciya gosterilecek iddia ve oneriler, mumkunse analiz gerekcesiyle birlikte saklanir.

## Guvenlik ve Veri Gizliligi

CV Agent hassas kisisel veri isler.

Guvenlik prensipleri:

- Her kullaniciya ozel endpoint authenticated kullanici baglami ile calisir.
- Kullanici yalnizca kendi profil, analiz ve CV kayitlarina erisebilir; repository sorgulari `user_id` ile filtrelenir.
- PII iceren loglar maskelenir veya kisaltilir; agent hata loglarinda yanit gövdesi 1000 karaktere kirpilir.
- Agent tool'lari `user_id` baglamindan bagimsiz veri okuyamaz.
- Prompt injection riski nedeniyle is ilani metni ve DOCX/URL icerigi guvenilmeyen input kabul edilir.
- Extension'dan/URL'den gelen sayfa metni sistem talimati degil veri girdisi olarak islenir.
- Agent'a shell veya unrestricted filesystem tool'u verilmez.

## Hata Yonetimi

Hata tipleri ayrilmalidir:

- Validation hatasi: 422 (Elysia `VALIDATION` koduna baglanir).
- Kaynak (URL/DOCX) cikarim hatasi: 400 (`ProfileSourceExtractionError`).
- Auth hatasi: 401/403 (`AuthenticationRequiredError`, `InvalidTokenError`).
- Kayit bulunamadi: 404.
- Agent yapilandirma hatasi: 500 (`*AgentConfigurationError`, ornegin `GROQ_API_KEY` eksik).
- LLM provider hatasi: 502 (`*AgentRequestError`, retry sonrasi).
- Beklenmeyen hata: 500.
- Timeout: agent katmaninda `agentRequestTimeoutSeconds` ile sinirlandirilir; uygulama seviyesinde retry ile karsilanir, ardindan 502'ye donusur.

Genel yakalayici `app.ts` icindeki `onError` handler'idir; route dosyalari domaine ozgu hata siniflarini once isler.

## Konfigurasyon

Calisma zamani ayarlari `core/config.ts` icindeki `Settings` tipine ve `getSettings()` fonksiyonuna baglanir. Onemli env degiskenleri:

- `DATABASE_URL`
- `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- `CORS_ALLOWED_ORIGINS`, `CORS_ALLOWED_ORIGIN_REGEX`
- `GROQ_API_KEY`, `AGENT_MODEL`, `AGENT_REQUEST_TIMEOUT_SECONDS`, `AGENT_MAX_RETRIES`
- `ENVIRONMENT`, `HOST`, `PORT`, `APP_NAME`, `API_VERSION`

`getSettings()` cache'lenir; testlerde `resetSettingsCache()` ile sifirlanabilir.

## Test Stratejisi

Testler risk seviyesine gore katmanlanir:

- Schema testleri: TypeBox semalari ve validation kurallari.
- Service unit testleri: agent client katmani mock'lanarak use-case akislari.
- Repository testleri: Drizzle query ve constraint davranislari.
- API testleri: Elysia `app.handle` ile endpoint sozlesmeleri.
- Golden output testleri: sabit profil + sabit is ilani icin analiz ve CV ciktisinin beklenen yapiyi korumasi.
- Agent evaluation testleri: kritik senaryolarda LLM sonucunun schema, kapsam ve guvenlik kriterlerine uymasi.

LLM gerektiren testler standart unit test pipeline'inda zorunlu olmamalidir. CI icin deterministic mock ve fixture'lar kullanilir; LLM evaluation ayrik calistirilir.

## Gelecek Evrim

Suanki sync request/response modeli yetersiz kalirsa ayni service ve agent sinirlari korunarak su yapiya gecilebilir:

```text
HTTP request
    -> run kaydi olusturulur
    -> queue'ya is yazilir
    -> worker agent workflow'u calistirir
    -> run status ve sonuc kaydedilir
    -> web UI polling, SSE veya WebSocket ile sonucu izler
```

Olasi yakin gelecek adimlari:

- `ResumeRepository` ve `cv_generations` tablosu ile uretilen CV'lerin kalici saklanmasi.
- ATS review/skor uretimi icin ayri bir agent client (`AtsReviewAgentClient`).
- Agent log/run gozlemlenebilirligi (latency, retry sayisi, validation basari orani).

Bu evrim icin bugunden korunmasi gereken sinirlar:

- Route dosyalari agent detayini bilmemeli.
- Service fonksiyonlari idempotent calismali.
- Agent run kimlikleri domain kayitlariyla iliskili olmali.
- LLM ciktisi her zaman schema validation'dan gecmeli.
- Tool'lar dar kapsamli ve yetki kontrollu olmali.
