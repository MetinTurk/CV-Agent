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
- `POST /api/profile-chat/message`

### Veri Katmani

Kalici veri icin PostgreSQL kullanilir. ORM katmani Drizzle ORM'dir.

Drizzle sorumluluklari:

- Tablo semalarini `apps/server/src/db/schema.ts` icinde tipli tutmak.
- Migration dosyalarini `apps/server/drizzle/` altinda uretmek.
- Repository katmanina tip guvenli query API'si vermek.

Repository dosyalari SQL/ORM detayini route ve agent katmanindan saklar. Transaction sinirlari use-case ihtiyacina gore service katmaninda netlestirilir.

### AI ve Agent Katmani

AI katmani TypeScript server sinirlarina uygun sekilde servis arkasinda tutulur. Profil toplama endpoint'i su anda request/response sozlesmesini koruyan deterministik profil birlestirme servisiyle calisir; LLM entegrasyonu eklendiginde route sozlesmesi degismeden servis icindeki agent implementation'i degistirilmelidir.

Gelecek AI entegrasyonlari icin ana prensipler:

- Agent ciktisi guvenilir kabul edilmez; TypeBox veya domain semalariyla dogrulanir.
- Agent'lar veritabanina dogrudan yazmaz; kalici yazi islemleri service/repository katmani uzerinden yapilir.
- Tool'lar dar kapsamli, tipli ve yetki kontrollu olur.
- Uzun suren analiz ve CV uretimi ileride queue/job modeline alinabilir.

## Klasor Yapisi

```text
apps/server/
+-- src/
|   +-- api/
|   |   +-- auth.ts
|   |   +-- health.ts
|   |   +-- profile-chat.ts
|   +-- core/
|   |   +-- config.ts
|   |   +-- security.ts
|   +-- db/
|   |   +-- client.ts
|   |   +-- schema.ts
|   |   +-- repositories/
|   |       +-- users.ts
|   +-- schemas/
|   |   +-- auth.ts
|   |   +-- error.ts
|   |   +-- health.ts
|   |   +-- profile-chat.ts
|   +-- services/
|   |   +-- auth-service.ts
|   |   +-- profile-chat-service.ts
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
- Auth/session baglamindan `user_id` almak.
- Ilgili servis fonksiyonunu cagirmak.
- Tipli response dondurmek.

Route dosyalari prompt olusturmaz, agent state yonetmez, veritabani query detaylarini bilmez ve CV/analiz domain kurallarini kendi icinde barindirmaz.

### Services

Service katmani use-case seviyesindeki is akisini yonetir.

Mevcut servisler:

- `AuthService`: Kayit, login, JWT uretimi ve bearer token ile kullanici dogrulama.
- `ProfileChatService`: Profil toplama sohbeti icin oturum state'i, profil patch cikarma, merge ve eksik alan hesabi.

Gelecek servisler:

- `JobAnalysisService`: Is ilani metnini normalize eder, kullanici profilini yukler, analiz agent'ini cagirir ve analiz sonucunu kaydeder.
- `ResumeService`: Analiz sonucunu ve kullanici profilini alir, CV generation agent'ini cagirir, ATS uyumlu CV ciktisini kaydeder.

### Schemas

API request/response sozlesmeleri TypeBox/Elysia `t` ile tanimlanir. TypeScript tipleri bu semalardan veya ilgili domain modellerinden turetilir.

Kritik model aileleri:

- `UserResponse`
- `AuthResponse`
- `ProfileData`
- `ProfileChatResponse`
- `JobFitAnalysis`
- `GeneratedResume`
- `ATSReviewResult`

### Repositories

Repository katmani Drizzle ORM erisimini soyutlar.

Repository prensipleri:

- ORM detaylari route veya agent dosyalarina sizmaz.
- Her repository tek aggregate veya tablo grubu uzerinden calisir.
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
    -> ProfileChatService
    -> conversation state yuklenir
    -> profil patch'i normalize edilir
    -> eksik zorunlu alanlar hesaplanir
    -> chatbot response doner
```

Response yalnizca serbest metin degildir. UI'in karar verebilmesi icin yapilandirilmis alanlar da doner:

- `reply`
- `session_id`
- `profile`
- `missing_required_fields`
- `is_profile_ready`

### Is Ilani Analizi

```text
Extension/Web -> POST /api/analyses
    -> JobAnalysisService
    -> is ilani metni normalize edilir
    -> kullanici profili yuklenir
    -> analiz agent'i invoke edilir
    -> structured output dogrulanir
    -> analiz sonucu kaydedilir
    -> analiz response doner
```

### Ilana Ozel CV Uretimi

```text
Web -> POST /api/resumes/generate
    -> ResumeService
    -> profil ve analiz sonucu yuklenir
    -> resume generation agent'i invoke edilir
    -> ATS review uygulanir
    -> structured output dogrulanir
    -> CV kaydedilir
    -> CV response doner
```

## Structured Output ve Dogrulama

LLM ciktisi guvenilir kabul edilmez.

Kurallar:

- Agent'lardan beklenen her kritik cikti TypeBox/domain semasi ile tanimlanir.
- Validation basarisiz olursa retry veya kontrollu hata mesaji uygulanir.
- Veritabanina yazilan yapilandirilmis LLM ciktisi once normalize edilir.
- UI'a giden response modelleri domain modellerinden ayri tutulabilir.
- Kullaniciya gosterilecek iddia ve oneriler, mumkunse analiz gerekcesiyle birlikte saklanir.

## Guvenlik ve Veri Gizliligi

CV Agent hassas kisisel veri isler.

Guvenlik prensipleri:

- Her kullaniciya ozel endpoint authenticated kullanici baglami ile calisir.
- Kullanici yalnizca kendi profil, analiz ve CV kayitlarina erisebilir.
- PII iceren loglar maskelenir veya kisaltilir.
- Agent tool'lari `user_id` baglamindan bagimsiz veri okuyamaz.
- Prompt injection riski nedeniyle is ilani metni guvenilmeyen input kabul edilir.
- Extension'dan gelen sayfa metni sistem talimati degil veri girdisi olarak islenir.
- Agent'a shell veya unrestricted filesystem tool'u verilmez.

## Hata Yonetimi

Hata tipleri ayrilmalidir:

- Validation hatasi: 422.
- Auth hatasi: 401/403.
- Kayit bulunamadi: 404.
- LLM provider hatasi: 502/503 benzeri gecici hata.
- Agent validation hatasi: kontrollu retry sonrasi 500 veya kullaniciya tekrar deneme mesaji.
- Timeout: 504 veya uygulama seviyesinde tekrar deneme onerisi.

## Test Stratejisi

Testler risk seviyesine gore katmanlanir:

- Schema testleri: TypeBox semalari ve validation kurallari.
- Service unit testleri: Agent/client katmani mock'lanarak use-case akislari.
- Repository testleri: Drizzle query ve constraint davranislari.
- API testleri: Elysia `app.handle` ile endpoint sozlesmeleri.
- Golden output testleri: Sabit profil + sabit is ilani icin analiz ve CV ciktisinin beklenen yapiyi korumasi.
- Agent evaluation testleri: Kritik senaryolarda LLM sonucunun schema, kapsam ve guvenlik kriterlerine uymasi.

LLM gerektiren testler standart unit test pipeline'inda zorunlu olmamalidir. CI icin deterministic mock ve fixture'lar kullanilir; LLM evaluation ayrik calistirilir.

## Gelecek Evrim

Request/response modeli yetersiz kalirsa ayni service ve agent sinirlari korunarak su yapiya gecilebilir:

```text
HTTP request
    -> run kaydi olusturulur
    -> queue'ya is yazilir
    -> worker agent workflow'u calistirir
    -> run status ve sonuc kaydedilir
    -> web UI polling, SSE veya WebSocket ile sonucu izler
```

Bu evrim icin bugunden korunmasi gereken sinirlar:

- Route dosyalari agent detayini bilmemeli.
- Service fonksiyonlari idempotent calismali.
- Agent run kimlikleri domain kayitlariyla iliskili olmali.
- LLM ciktisi her zaman schema validation'dan gecmeli.
- Tool'lar dar kapsamli ve yetki kontrollu olmali.
