# Kod Kalitesi Analiz Raporu

Issue: https://github.com/MetinTurk/CV-Agent/issues/48  
Tarih: 2026-05-06  
Yöntem: Matt Pocock engineering skills yaklaşımı, özellikle `improve-codebase-architecture` dilindeki Module, Interface, Depth, Seam, Adapter, Leverage ve Locality kavramları.

## Kısa Sonuç

CV-Agent kod tabanı erken aşama için okunabilir ve niyetini iyi anlatıyor: server tarafında route, schema, repository ve use-case modülleri ayrılmış; web tarafında shadcn/ui ve typed helper kullanımı başlamış; TypeScript `strict` korunuyor. En güçlü taraf, ürün akışının `AGENTS.md`, `SERVER_ARCHITECTURE.md` ve server dosya isimlerinde anlaşılır olması.

Ana kalite riski, bazı modüllerin şimdiden shallow hale gelmesi. Birkaç interface, implementation kadar çok ayrıntı taşıyor: LLM çağrısı + retry + JSON parsing iki ayrı agent client içinde tekrar ediyor; web tarafında API sözleşmeleri server schema'larından elle kopyalanıyor; profil sohbeti ve iş analizi akışları kalıcı state / idempotency / analiz detayı seam'leri netleşmeden büyüyor. Bu durum ileride CV üretimi, extension ve ATS kontrolü eklendiğinde locality kaybı yaratır.

## Analiz Kapsamı

İncelenen ana alanlar:

- `apps/server/src`: Elysia routes, TypeBox schemas, Drizzle schema/repositories, auth, profile chat, profile source extraction, job analysis.
- `apps/server/tests`: Mevcut Bun testleri.
- `apps/web/src`: Auth, profile chat, profile page, job analysis, CV review, sidebar ve typed HTTP helper modülleri.
- `packages/ui/src`: Ortak shadcn/ui tabanlı UI modülleri.
- `docs/extension-implementation-guide.md`, `SERVER_ARCHITECTURE.md`, `AGENTS.md`: Mimari ve domain niyeti.

Kapsam dışı bırakılanlar:

- `apps/server/app`, `apps/server/.venv`, `apps/server/cv_agent_server.egg-info`: Git durumunda untracked görünüyor ve mevcut AGENTS teknoloji kararları ElysiaJS/Bun yönünde olduğu için bu rapor onları implementation kaynağı kabul etmedi.
- `node_modules`, `dist`, `.turbo`, log dosyaları.

## Doğrulama Sonuçları

- `pnpm typecheck`: Çalıştırılamadı, çünkü `pnpm` PATH'te yok.
- `pnpm --filter server test`: Çalıştırılamadı, çünkü `pnpm` ve `bun` PATH'te yok.
- `apps/server` TypeScript: `tsc -p apps/server/tsconfig.json --noEmit` başarılı.
- `packages/ui` TypeScript: `tsc -p packages/ui/tsconfig.json --noEmit` başarılı.
- `apps/web` TypeScript: Başarısız. `apps/web/src/App.tsx:8` içinde `ProfileDashboardPage` import edilmiş ama kullanılmıyor.
- `apps/web` ESLint: Başarısız. Aynı unused import hatası.
- `packages/ui` ESLint: Başarılı.

Bu sonuç, repo genelinde tip güvenliği hedefinin büyük ölçüde çalıştığını ama web tarafında CI'ı kıracak küçük bir hijyen hatası bulunduğunu gösteriyor.

## Öncelikli Bulgular

### 1. Web typecheck şu an kırılıyor

Dosyalar:

- `apps/web/src/App.tsx`

Problem:

`ProfileDashboardPage` import'u kullanılmıyor. `noUnusedLocals` açık olduğu için bu tek satır web typecheck ve lint'i kırıyor.

Etkisi:

Bu küçük hata CI kapısını gereksiz yere kapatır. Ürün davranışı açısından risk düşük, fakat geliştirme akışı açısından yüksek gürültü üretir.

Öneri:

Kullanılmayacaksa import kaldırılmalı. Eğer dashboard route'u geri gelecekse route açıkça bağlanmalı ve ürün akışındaki `/profile` ile `ProfileDashboardPage` ayrımı netleştirilmeli.

### 2. Agent client modülleri shallow tekrar üretmeye başladı

Dosyalar:

- `apps/server/src/services/profile-agent-client.ts`
- `apps/server/src/services/job-analysis-agent-client.ts`

Problem:

İki modül de Groq URL, retry, timeout, `fetch`, hata sınıflandırma, JSON object extraction ve structured parsing sorumluluklarını kendi içinde taşıyor. Interface'ler farklı görünse de implementation'ın önemli kısmı aynı davranışı tekrar ediyor.

Deletion test:

Bu modüllerden birindeki retry veya JSON parsing davranışı silinse aynı karmaşıklık diğerinde kalır ve yeni CV generation agent'i eklendiğinde üçüncü kez kopyalanır. Bu, gerçek bir shallow module sinyali.

Çözüm:

Groq chat completion davranışı için daha deep bir Module oluşturun. Dış interface, örneğin "structured JSON agent çağrısı" kadar küçük kalmalı; timeout, retry, response format, provider hata mesajı ve JSON object recovery implementation içinde saklanmalı.

Beklenen fayda:

Leverage artar: Profile, job analysis, match analysis ve gelecekteki resume generation aynı agent client interface'inden yararlanır. Locality artar: provider değişimi, retry politikası veya JSON parsing düzeltmesi tek yerde yapılır.

### 3. Frontend API sözleşmeleri server sözleşmelerinden elle kopyalanıyor

Dosyalar:

- `apps/server/src/schemas/*.ts`
- `apps/web/src/lib/auth-api.ts`
- `apps/web/src/lib/profile-chat-api.ts`
- `apps/web/src/lib/profile-api.ts`
- `apps/web/src/lib/job-analysis-api.ts`

Problem:

Server response/request modelleri TypeBox ile tanımlanmış, fakat web tarafı aynı sözleşmeleri ayrı TypeScript type'ları olarak yeniden yazıyor. Bu iki interface arasında gerçek bir seam yok; yalnızca manuel senkronizasyon var.

Deletion test:

Web type'ları silinse karmaşıklık yok olmaz; aynı alan listeleri call site'lara veya server schema'larına geri dağılır. Mevcut haliyle bu module'ler düşük depth sunuyor.

Çözüm:

Kısa vadede `packages/shared` veya `packages/api-contracts` gibi bir Module ile ortak domain/API sözleşmeleri paylaşılmalı. Orta vadede Elysia ekosisteminde Eden Treaty veya schema-derived client değerlendirilebilir.

Beklenen fayda:

Leverage artar: Web, extension ve server aynı interface'i kullanır. Locality artar: `JobAnalysisResponse`, `ProfileData`, auth response ve hata payload değişiklikleri tek yerde doğrulanır.

### 4. Profil sohbet state'i memory-only ve process-local

Dosyalar:

- `apps/server/src/services/profile-chat-service.ts`
- `apps/server/src/db/repositories/profiles.ts`

Problem:

`ProfileChatService` conversation state'i process içindeki `Map` ile tutuyor ve yalnızca profil hazır olduğunda DB'ye yazıyor. Server restart, multi-instance deployment veya uzun onboarding oturumunda state kaybı olur.

Interface riski:

`chat(user, request, sourceContext)` interface'i, state'in kalıcı mı geçici mi olduğunu çağırana söylemiyor. Bu bilgi interface'in görünmeyen bir invariant'ı haline gelmiş.

Çözüm:

Profil toplama oturumu için ayrı bir conversation state Module oluşturun. İlk adapter memory olabilir, ikinci adapter Postgres olduğunda seam gerçek hale gelir. Şimdiden interface'i dar tutmak yeterli: load, append, saveProfileReady gibi use-case seviyesinde davranışlar.

Beklenen fayda:

Locality artar: oturum state'i, merge ve persistence davranışı tek yerde netleşir. Test yüzeyi iyileşir: service testleri sadece use-case sonucunu doğrular, state saklama ayrıntısı adapter testlerine taşınır.

### 5. İş analizi akışı URL okuma, LLM çıkarımı, match analysis ve persistence'ı tek transaction gibi davranmadan sıralıyor

Dosyalar:

- `apps/server/src/services/job-analysis-service.ts`
- `apps/server/src/services/profile-source-service.ts`
- `apps/server/src/db/repositories/job-analyses.ts`

Problem:

`analyzeAndSave` URL extraction, job description generation, profile loading, match generation ve DB create adımlarını tek method içinde sıralıyor. Match analysis hata alırsa kayıt yine yazılıyor; bu ürün için anlaşılır olabilir, ama interface bu partial success durumunu güçlü biçimde modellemiyor.

Çözüm:

`JobAnalysisRun` veya benzer bir deep Module düşünülmeli. Interface, "başlatıldı / job description çıkarıldı / match analysis üretildi / kaydedildi" gibi durumları modelleyebilir. Queue/job modeline geçiş planı `SERVER_ARCHITECTURE.md` içinde zaten var; mevcut method bu yönde evrilmek için iyi bir aday.

Beklenen fayda:

Leverage artar: extension, web modal ve ileride worker aynı run interface'ini kullanır. Locality artar: retry, partial failure, status ve redirect davranışı tek yerde toplanır.

### 6. ProfileSourceService çok fazla dosya formatı ve ağ ayrıntısını tek module içinde taşıyor

Dosyalar:

- `apps/server/src/services/profile-source-service.ts`

Problem:

URL fetch, HTML stripping, DOCX validation, ZIP central directory parsing, XML text extraction, entity decoding ve truncation aynı module içinde. Bu implementation çalışır durumda ve test edilmiş, fakat interface büyümeye başlarsa module shallowlaşır.

Çözüm:

Şimdilik büyük refactor şart değil. Ancak üçüncü kaynak tipi eklendiğinde `ProfileSourceExtractor` seam'i oluşturulmalı: URL adapter, DOCX adapter ve ileride PDF/GitHub adapter ayrı implementation olabilir. Tek adapter varken seam teorik kalır; üçüncü kaynak gelene kadar ölçülü davranmak doğru olur.

Beklenen fayda:

Locality korunur: DOCX parser hataları URL extraction davranışını etkilemez. Testler daha hedefli olur.

### 7. Web sayfa modülleri büyümüş ve bazıları mock/static veriyle ürün akışından ayrışmış

Dosyalar:

- `apps/web/src/components/profile-dashboard/profile-dashboard-page.tsx`
- `apps/web/src/components/profile-dashboard/profile-dashboard.mock.ts`
- `apps/web/src/components/job-analysis/cv-review-page.tsx`
- `apps/web/src/components/job-analysis/job-analysis-page.tsx`

Problem:

`profile-dashboard-page.tsx` yaklaşık 520 satır ve mock veriyle çalışıyor. `cv-review-page.tsx` statik CV preview ve wizard UI içeriyor. Bunlar ürün tasarımı için değerli, ama gerçek domain state'iyle seam kurulmadığı sürece değişiklikler UI içinde dağılır.

Çözüm:

Sayfa module'lerini "container + section modules" şeklinde ayırmak iyi olur. Önce gerçek use-case interface'i tanımlanmalı: saved profile, job analysis detail, resume draft, ATS review. Sonra UI section'ları bu dar interface'leri tüketmeli.

Beklenen fayda:

Leverage artar: aynı section modules gerçek API, story/mock ve test fixture ile kullanılabilir. Locality artar: profile veya resume draft alanı değişince tek data mapper güncellenir.

### 8. Browser extension klasörü boş, fakat doküman ve server/web akışı extension'ı varsayıyor

Dosyalar:

- `apps/chrome-extension`
- `docs/extension-implementation-guide.md`
- `apps/web/src/lib/browser-extension.ts`
- `apps/web/src/components/extension-install/extension-install-prompt.tsx`

Problem:

Ürün akışında extension merkezi bir Module, fakat implementation henüz yok. Web içinde extension installed check ve prompt var; server tarafında `POST /api/job-analyses` URL alıyor. Dokümandaki hedef sözleşme ise extension'ın normalize edilmiş `ExtractedJobPosting` göndermesini öneriyor.

Çözüm:

Extension başlamadan önce server `job-analyses` request interface'i netleştirilmeli: sadece URL mi alınacak, yoksa extension-extracted job posting mi? İkisini destekleyecekse iki adapter açık isimlenmeli.

Beklenen fayda:

Locality artar: extension parser, server source extraction ve web manual URL modal birbirinin davranışını gizlice değiştirmez.

## Pozitif Gözlemler

- Server dosyalarının çoğunda modül sorumluluk yorumu var; bu AGENTS standardıyla uyumlu.
- Route, schema, service ve repository ayrımı genel olarak temiz.
- `ProfileChatService` dependency injection ile test edilebilir hale getirilmiş.
- LLM çıktısı doğrudan güvenilmemiş; unknown input parsing ve sanitize adımları var.
- `ProfileSourceService` için URL ve DOCX extraction testleri mevcut.
- `packages/ui` lint ve typecheck başarılı.
- TypeScript `strict`, web tarafında `noUnusedLocals`, `noUnusedParameters` ve `noUncheckedSideEffectImports` açık.

## Test Boşlukları

- `JobAnalysisAgentClient` parser ve retry davranışı için test yok.
- `JobAnalysisService` partial match failure ve profile missing senaryoları için test yok.
- Route seviyesinde `app.handle` ile auth, validation ve error mapping testleri yok.
- Web tarafında React component veya route smoke testleri yok.
- API helper'ları için hata payload formatları test edilmiyor.
- Extension implementation olmadığı için extension-related acceptance testleri henüz yok.

## Önerilen Sıralama

1. Web typecheck/lint hatasını düzeltin: `ProfileDashboardPage` import'u kaldırılmalı veya route'a bağlanmalı.
2. Agent provider için deep Module çıkarın: Groq fetch/retry/JSON parsing tek implementation içinde toplansın.
3. Shared API contracts Module oluşturun: web/server/extension sözleşmeleri elle kopyalanmasın.
4. Job analysis request interface'ini netleştirin: URL adapter ve extension-extracted payload adapter ayrımı yapılmalı.
5. Profil conversation state için kalıcı seam tasarlayın: memory adapter kısa vadede kalabilir, Postgres adapter yolunu kapatmasın.
6. Büyük web sayfalarını gerçek use-case interface'lerine göre section modules'a bölün.
7. `CONTEXT.md`, `docs/agents/domain.md` ve ADR klasörü eklenerek Matt Pocock skills için domain hafızası tamamlanmalı.

## Matt Pocock Skills Kurulum Notu

Repo kökünde `AGENTS.md` var, fakat `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/agents/` ve `docs/adr/` bulunmuyor. Bu yüzden analiz domain sözlüğü olarak `AGENTS.md`, `SERVER_ARCHITECTURE.md` ve `docs/extension-implementation-guide.md` içeriğini kullandı.

Gelecek mimari analizlerin daha tutarlı olması için ayrı bir takip işiyle `setup-matt-pocock-skills` çalıştırılıp şu dosyalar eklenmeli:

- `docs/agents/issue-tracker.md`
- `docs/agents/triage-labels.md`
- `docs/agents/domain.md`
- `CONTEXT.md` veya multi-context gerekiyorsa `CONTEXT-MAP.md`
- `docs/adr/`
