# CV Agent

## Proje Tanitimi

CV Agent, kullanicinin profil ve yetenek bilgilerini toplayan, bu bilgileri is ilani detaylariyla eslestiren ve ilana en uygun CV'yi uretmeyi hedefleyen bir CV olusturma platformudur.

Temel urun akisi su sekildedir:

1. Kullanici web uygulamasi uzerinden giris yapar.
2. Chatbot, kullanicinin CV icin gerekli bilgilerini toplar.
3. Toplanan bilgiler yapilandirilmis olarak veritabaninda tutulur.
4. Kullanici bir is ilani sayfasindayken browser extension'i acar ve "analiz et" aksiyonunu baslatir.
5. AI, is ilani detaylarini toplar ve kullanicinin kayitli profiliyle birlikte analiz eder.
6. Analiz tamamlandiginda kullanici ilgili is ilani analiz sayfasina yonlendirilir.
7. Analiz sayfasinda kullanicinin yetenekleri, lokasyonu, projeleri, sertifikalari, dilleri, deneyimleri, egitimi ve not ortalamasi is ilani beklentileriyle karsilastirilir.
8. Kullanici analiz sayfasindan ilana ozel CV uretir. CV uretimi ATS uyumlulugu ve CV best practice'leri dikkate alinarak yapilir.

Bu projenin nihai amaci, kullanicinin mevcut profilini somut bir is ilanina gore yorumlamak, eksik ve guclu yonlerini acikca gostermek ve basvuruda kullanilabilecek optimize edilmis bir CV uretmektir.

## Kullanilan Teknolojiler

### Monorepo ve Gelistirme Altyapisi

- **pnpm**: Workspace ve paket yonetimi icin kullanilir.
- **Turborepo**: Monorepo icindeki build, dev, lint ve typecheck gorevlerini koordine eder.
- **TypeScript**: Web, server ve paylasilan paketlerde ana dil olarak kullanilir.
- **Prettier**: Kod formatlama icin kullanilir.

### Web Uygulamasi

- **React 19**: Web arayuzu icin kullanilir.
- **Vite**: Frontend gelistirme ve build altyapisi olarak kullanilir.
- **Tailwind CSS 4**: Stil sistemi icin kullanilir.
- **shadcn/ui**: UI bilesen mimarisi ve component uretim akisi icin kullanilir.
- **Radix UI**: Erisilebilir primitive UI davranislari icin kullanilir.
- **lucide-react**: Ikon seti olarak kullanilir.

### Paylasilan UI Paketi

- **@workspace/ui**: Web uygulamasinin kullandigi ortak component, hook, utility ve global stilleri barindirir.
- **class-variance-authority**, **clsx**, **tailwind-merge**: Varyantli ve tutarli component stilleri icin kullanilir.
- **zod**: Veri dogrulama semalari icin kullanilabilir.

### Server

- **Bun**: Server runtime ve lokal gelistirme runner'i olarak kullanilir.
- **ElysiaJS**: HTTP API katmani ve TypeScript-first endpoint mimarisi icin kullanilir.
- **TypeBox / Elysia `t`**: Request/response semalari ve runtime validation icin kullanilir.
- **Drizzle ORM**: Tip guvenli veritabani erisimi ve migration uretimi icin kullanilir.
- **PostgreSQL**: Kalici server veritabani olarak kullanilir.

### Browser Extension

- **Chrome Extension alani**: Is ilani web sayfasinda analiz aksiyonunu baslatacak extension icin ayrilmistir. Bu klasor su an baslangic seviyesindedir ve implementation ilerledikce manifest, content script, background script ve popup arayuzu burada konumlandirilmalidir.

## Temel Klasor Yapisi

```text
.
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── components/
│   │   ├── components.json
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── server/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   ├── core/
│   │   │   ├── db/
│   │   │   ├── schemas/
│   │   │   ├── services/
│   │   │   ├── app.ts
│   │   │   └── index.ts
│   │   ├── drizzle/
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   └── README.md
│   └── chrome-extension/
├── packages/
│   └── ui/
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── lib/
│       │   └── styles/
│       ├── components.json
│       └── package.json
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── turbo.json
```

### Klasorlerin Sorumluluklari

- **apps/web**: Kullanici girisi, chatbot deneyimi, analiz sayfalari ve CV uretim ekranlari gibi son kullanici arayuzlerini barindirir.
- **apps/server**: API endpoint'leri, AI analiz akislari, veritabani islemleri ve backend is kurallarini barindirir.
- **apps/chrome-extension**: Is ilani sayfalarinda calisacak browser extension kodlarini barindirir.
- **packages/ui**: Web uygulamasinda tekrar kullanilacak ortak UI component'leri, stiller, hook'lar ve yardimci fonksiyonlari barindirir.
- **package.json**: Root workspace komutlarini ve ortak gelistirme bagimliliklarini tanimlar.
- **pnpm-workspace.yaml**: Monorepo icindeki workspace paketlerini tanimlar.
- **turbo.json**: Turborepo task graph ve cache davranislarini tanimlar.

## Kodlama Standartlari

Bu proje LLM destekli olarak gelistirilecegi icin kodun okunabilir, tahmin edilebilir ve tip guvenli olmasi zorunludur.

- **Strong typing zorunludur**: TypeScript tarafinda `strict` ayarlari korunur; server ve web kodunda belirsiz veri icin explicit type, schema veya domain modeli kullanilir.
- **Implicit `any` kullanilmaz**: TypeScript kodunda belirsiz tipler yerine domain modeli, union type, generic veya explicit interface/type tanimlari kullanilir.
- **Server veri modelleri TypeBox ile tanimlanir**: API request/response govdeleri ve yapilandirilmis agent/AI ciktilari TypeBox/Elysia `t` semalariyla temsil edilir.
- **Her kod modulu aciklanir**: Her `.ts` ve `.tsx` kaynak dosyasinin basinda dosyanin sorumlulugunu anlatan kisa bir yorum satiri bulunur.
- **Modul sinirlari net tutulur**: Route, schema, servis, agent, repository ve UI component sorumluluklari ayni dosyada karistirilmaz.
- **LLM ciktilari dogrulanir**: AI tarafindan uretilen veya parse edilen yapilandirilmis veriler veritabanina yazilmadan ya da UI'a gonderilmeden once tipli semalarla dogrulanir.
- **Kamuya acik fonksiyonlar tipli olur**: Export edilen TypeScript fonksiyonlari acik parametre tipleriyle yazilir; Elysia route handler'larinda schema inference tercih edilir.
- **İstemci metinleri Türkçe karakterli olur**: Web uygulamasında kullanıcıya gösterilen tüm Türkçe metinler Türkçe karakterlerle yazılır; `Giris`, `Sifre`, `Kayit` gibi ASCII transliterasyonlar kullanılmaz.
- **React bileşenlerinde shadcn önceliklidir**: React tarafında UI oluştururken mümkün olduğunda önce shadcn/ui bileşenleri kullanılır; özel markup veya custom component yalnızca mevcut shadcn bileşeni ihtiyacı karşılamadığında yazılır.

## Gelistirme Komutlari

Root dizinden:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm format
```

Server uygulamasi icin:

```bash
pnpm --filter server dev
pnpm --filter server db:generate
pnpm --filter server db:push
```

Web uygulamasi icin:

```bash
cd apps/web
pnpm dev
```
