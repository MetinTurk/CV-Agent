# SERVER_ARCHITECTURE.md

## Amac

Bu dokuman, CV Agent server mimarisinin sorumluluklarini, modul sinirlarini ve LLM/agent katmaninin nasil konumlanacagini tanimlar.

CV Agent server'in temel gorevi kullanicinin profil bilgisini toplamak, bu bilgiyi is ilani detaylariyla karsilastirmak, analiz sonucunu yapilandirilmis olarak uretmek ve ilana ozel ATS uyumlu CV uretim surecini yonetmektir.

Ilk surum icin API modeli request/response olarak kalir. Arka plan job, queue veya worker mimarisi ilk kapsamda zorunlu degildir. Buna ragmen server tasarimi, ileride uzun sureli analiz ve CV uretim islerinin job modeline alinabilmesini engellemeyecek sekilde moduler tutulur.

## Ana Mimari Kararlari

### 1. Runtime ve API Katmani

Server uygulamasi Python 3.11+ ve FastAPI uzerinde calisir.

FastAPI katmani yalnizca HTTP sozlesmelerinden, auth/session baglamindan, request dogrulamadan, response modellerinden ve servis cagrilarindan sorumludur. Agent workflow, veritabani erisimi ve domain kurallari route dosyalarina gomulmez.

Onerilen API karakteri:

- Chatbot mesajlari request/response calisir.
- Is ilani analizi request/response calisir.
- CV uretimi request/response calisir.
- Her agent cagrisi `conversation_id`, `user_id`, `analysis_id` veya `generation_id` gibi izlenebilir kimliklerle calistirilir.
- Uzun suren isler icin ilk surumde makul timeout ve kullaniciya tekrar deneme mesaji yeterlidir.

### 2. LLM ve Agent Katmani

Bu projenin LLM katmani icin ana tercih **Deep Agents + LangGraph tabanli mimari**dir.

Bu secimin nedeni, urunun yalnizca tek seferlik prompt-response akisi olmamasidir. Kullanici chatbot ile parca parca bilgi verebilir, eksik alanlar farkli senaryolara gore degisebilir, is ilani analizi birden fazla uzman bakis acisi gerektirebilir ve CV uretimi dogrulanmis yapilandirilmis verilere dayanmalidir.

Katmanlar su sekilde konumlanir:

- **Deep Agents**: Ust seviye agent harness. Profil toplama, bilgi tamamlama, analiz ve CV uretim akisini planlama, uzman subagent'lara is devretme ve uzun konusma baglamini yonetme icin kullanilir.
- **LangGraph**: Deep Agents'in altinda state, checkpoint, durable execution, human-in-the-loop ve gerekirse ozel deterministik graph workflow'lari icin temel runtime olarak kabul edilir.
- **LangChain**: Model entegrasyonlari, tool tanimlari, prompt sablonlari, structured output ve parser gibi primitive'ler icin kullanilir.

LangChain tek basina basit agent'lar icin yeterlidir; ancak CV Agent'in chatbot, profil tamamlama, ilan analizi ve CV uretimindeki dallanan senaryolari icin ana mimari katman olarak daha yuksek seviyeli Deep Agents tercih edilir.

Resmi referanslar:

- [Deep Agents overview](https://docs.langchain.com/oss/python/deepagents/overview)
- [LangGraph durable execution](https://docs.langchain.com/oss/python/langgraph/durable-execution)
- [LangGraph overview](https://docs.langchain.com/oss/javascript/langgraph)

### 3. Request/Response Siniri

Deep Agents ve LangGraph kullanimi, ilk surumde mutlaka background worker gerektirmez. Her HTTP istegi ilgili agent veya workflow'u invoke eder ve sonucunu response olarak dondurur.

Bu karar ilk surum karmasikligini dusurur:

- Queue, worker ve job status endpoint'leri ertelenir.
- Frontend baslangicta polling/SSE/WebSocket zorunlulugu tasimaz.
- Daha hizli MVP gelistirilir.

Riskler:

- LLM cagrilari yavaslayabilir.
- Analiz veya CV uretimi timeout'a girebilir.
- Kullanici bekleme deneyimi sinirli kalabilir.

Bu riskler nedeniyle servis sinirlari, ileride ayni domain servislerinin async job runner tarafindan da cagrilabilecegi sekilde tasarlanir.

## Onerilen Klasor Yapisi

```text
apps/server/app/
+-- api/
|   +-- routes/
|   |   +-- auth.py
|   |   +-- chat.py
|   |   +-- profiles.py
|   |   +-- job_posts.py
|   |   +-- analyses.py
|   |   +-- resumes.py
|   +-- router.py
+-- agents/
|   +-- cv_profile_agent.py
|   +-- job_analysis_agent.py
|   +-- resume_generation_agent.py
|   +-- subagents/
|   |   +-- skill_matcher.py
|   |   +-- experience_matcher.py
|   |   +-- ats_reviewer.py
|   |   +-- resume_writer.py
|   +-- tools/
|   |   +-- profile_tools.py
|   |   +-- job_post_tools.py
|   |   +-- resume_tools.py
|   +-- prompts/
|       +-- profile_collection.md
|       +-- job_analysis.md
|       +-- resume_generation.md
+-- core/
|   +-- config.py
|   +-- logging.py
|   +-- security.py
|   +-- llm.py
+-- db/
|   +-- session.py
|   +-- models/
|   +-- repositories/
+-- schemas/
|   +-- chat.py
|   +-- profile.py
|   +-- job_post.py
|   +-- analysis.py
|   +-- resume.py
+-- services/
|   +-- chat_service.py
|   +-- profile_service.py
|   +-- job_analysis_service.py
|   +-- resume_service.py
+-- main.py
```

Bu yapi hedef mimaridir. Ilk implementasyonda yalnizca gereken modul dosyalari acilmalidir.

## Modul Sorumluluklari

### API Routes

Route dosyalari HTTP sozlesmesini temsil eder.

Route sorumluluklari:

- Request body ve path/query parametrelerini almak.
- Pydantic request modelleriyle dogrulama yapmak.
- Auth/session baglamindan `user_id` almak.
- Ilgili servis fonksiyonunu cagirmak.
- Pydantic response modeli dondurmek.

Route dosyalari su isleri yapmaz:

- Prompt olusturmaz.
- Agent state yonetmez.
- Veritabani query detaylarini bilmez.
- CV veya analiz domain kuralini kendi icinde barindirmaz.

### Services

Service katmani use-case seviyesindeki is akisini yonetir.

Ornek servisler:

- `ChatService`: Kullanici mesajini alir, profil agent'ini cagirir, profil taslagini gunceller ve chatbot cevabini dondurur.
- `JobAnalysisService`: Is ilani metnini normalize eder, kullanici profilini yukler, analiz agent'ini cagirir ve analiz sonucunu kaydeder.
- `ResumeService`: Analiz sonucunu ve kullanici profilini alir, CV generation agent'ini cagirir, ATS uyumlu CV ciktisini kaydeder.

Service katmani agent'in nasil calistigini bilir ama agent prompt detaylarini route'a sizdirmaz.

### Agents

Agent katmani LLM tabanli karar ve uretim sureclerini yonetir.

Onerilen ana agent'lar:

- `CVProfileAgent`: Chatbot konusmasindan kullanicinin profil bilgisini toplar, eksik alanlari belirler, siradaki en iyi soruyu uretir.
- `JobAnalysisAgent`: Is ilanini kullanici profiliyle karsilastirir, guclu yonleri, eksikleri, riskleri ve onerileri yapilandirilmis olarak uretir.
- `ResumeGenerationAgent`: Analiz sonucuna gore ATS uyumlu, ilana ozel CV icerigi uretir.

Onerilen subagent'lar:

- `SkillMatcher`: Ilan becerileriyle kullanici becerilerini karsilastirir.
- `ExperienceMatcher`: Deneyim, proje ve rol uyumunu analiz eder.
- `EducationMatcher`: Egitim, GPA, sertifika ve dil uygunlugunu degerlendirir.
- `ATSReviewer`: Uretilen CV'nin ATS okunabilirligini ve temel CV best practice'lerini kontrol eder.
- `ResumeWriter`: Nihai CV bolumlerini olusturur.

Agent'lar veritabanina dogrudan yazmaz. Kalici yazi islemleri tool veya service katmani uzerinden kontrollu yapilir.

### Tools

Tool'lar agent'larin kontrollu sekilde domain verisine erismesini saglar.

Tool prensipleri:

- Her tool dar kapsamli ve tipli olur.
- Tool input/output modelleri Pydantic ile tanimlanir.
- Yazma islemleri idempotent tasarlanir.
- Hassas veya geri alinmasi zor islemler ileride human-in-the-loop onayina acik olacak sekilde ayrilir.

Ornek tool'lar:

- `get_user_profile(user_id)`
- `update_profile_draft(user_id, patch)`
- `get_job_post(job_post_id)`
- `save_analysis_result(analysis_id, result)`
- `save_generated_resume(resume_id, content)`

### Schemas

Pydantic modelleri hem API sozlesmeleri hem de LLM structured output dogrulamasi icin kullanilir.

Kritik modeller:

- `UserProfile`
- `ProfileCompleteness`
- `JobPost`
- `JobRequirement`
- `JobFitAnalysis`
- `SkillMatch`
- `ExperienceMatch`
- `ResumeDraft`
- `GeneratedResume`
- `ATSReviewResult`

LLM tarafindan uretilen her yapilandirilmis sonuc once Pydantic model ile dogrulanir, sonra veritabanina yazilir veya API response olarak dondurulur.

### Repositories

Repository katmani veritabani erisimini soyutlar.

Repository prensipleri:

- SQL/ORM detaylari route veya agent dosyalarina sizmaz.
- Her repository tek aggregate veya tablo grubu uzerinden calisir.
- Transaction sinirlari service katmaninda netlestirilir.

## Temel Veri Akislari

### 1. Chatbot ile Profil Toplama

```text
Web -> POST /api/chat/messages
    -> ChatService
    -> mevcut conversation ve profil taslagi yuklenir
    -> CVProfileAgent invoke edilir
    -> agent eksik alanlari ve siradaki soruyu belirler
    -> profil taslagi Pydantic ile dogrulanir
    -> profil taslagi kaydedilir
    -> chatbot cevabi response olarak doner
```

Response yalnizca serbest metin olmamalidir. UI'in karar verebilmesi icin yapilandirilmis alanlar da donmelidir:

- `message`
- `conversation_id`
- `profile_patch`
- `missing_fields`
- `completion_score`
- `next_question`

### 2. Is Ilani Analizi

```text
Extension/Web -> POST /api/analyses
    -> JobAnalysisService
    -> is ilani metni normalize edilir
    -> kullanici profili yuklenir
    -> JobAnalysisAgent invoke edilir
    -> subagent'lar beceri, deneyim, egitim ve ATS sinyallerini analiz eder
    -> JobFitAnalysis modeliyle dogrulama yapilir
    -> analiz sonucu kaydedilir
    -> analiz response olarak doner
```

Analiz sonucu en az su bolumleri icermelidir:

- Genel uyum skoru
- Eslesen beceriler
- Eksik beceriler
- Guclu deneyim/proje sinyalleri
- Lokasyon/uzaktan calisma uyumu
- Dil, egitim, GPA ve sertifika degerlendirmesi
- Basvuru riski ve onerilen aksiyonlar

### 3. Ilana Ozel CV Uretimi

```text
Web -> POST /api/resumes/generate
    -> ResumeService
    -> profil ve analiz sonucu yuklenir
    -> ResumeGenerationAgent invoke edilir
    -> ResumeWriter CV taslagini uretir
    -> ATSReviewer sonucu kontrol eder
    -> GeneratedResume modeliyle dogrulama yapilir
    -> CV kaydedilir
    -> CV response olarak doner
```

CV uretimi ham metin olarak degil, bolumlere ayrilmis yapilandirilmis model olarak saklanmalidir:

- Header
- Professional summary
- Skills
- Experience
- Projects
- Education
- Certifications
- Languages
- ATS notes

## Agent State ve Memory

Ilk surumde memory iki seviyeli dusunulur:

1. **Kalici domain verisi**: Kullanici profili, sohbet oturumlari, analizler ve CV'ler veritabaninda saklanir.
2. **Agent execution state**: Deep Agents/LangGraph `thread_id` ve checkpoint mekanizmasi ile agent konusma baglami izlenir.

Web server ortaminda agent'a serbest filesystem erisimi verilmez. Deep Agents kullanilirken local filesystem backend yerine state/store tabanli veya sandbox'lanmis backend tercih edilir. Kalici domain yazimlari yalnizca tipli tool'lar ve service katmani uzerinden yapilir.

Thread kimligi stratejisi:

- Profil chatbot icin: `profile:{user_id}:{conversation_id}`
- Is ilani analizi icin: `analysis:{user_id}:{analysis_id}`
- CV uretimi icin: `resume:{user_id}:{resume_id}`

Bu kimlikler trace, checkpoint ve debug kayitlarini domain kayitlariyla iliskilendirmek icin kullanilir.

## Structured Output ve Dogrulama

LLM ciktisi guvenilir kabul edilmez.

Kurallar:

- Agent'lardan beklenen her kritik cikti Pydantic schema ile tanimlanir.
- Schema validation basarisiz olursa retry veya kontrollu hata mesaji uygulanir.
- Veritabanina yazilan yapilandirilmis LLM ciktisi once normalize edilir.
- UI'a giden response modelleri domain modellerinden ayri tutulabilir.
- Kullaniciya gosterilecek iddia ve oneriler, mumkunse analiz gerekcesiyle birlikte saklanir.

## Observability

Agent sistemlerinde debug edilebilirlik urun kalitesi icin kritiktir.

Kaydedilmesi gereken alanlar:

- `user_id`
- `conversation_id`
- `thread_id`
- `agent_name`
- `model_name`
- `input_summary`
- `output_summary`
- `tool_calls`
- `validation_errors`
- `latency_ms`
- `token_usage`
- `created_at`

LLM trace ve evaluation icin LangSmith gibi LangChain ekosistemiyle uyumlu gozlemlenebilirlik araci kullanilabilir. Uretim ortaminda ham kullanici CV verisi ve kisisel bilgiler icin log maskeleme uygulanmalidir.

## Guvenlik ve Veri Gizliligi

CV Agent hassas kisisel veri isler.

Guvenlik prensipleri:

- Her endpoint authenticated kullanici baglami ile calisir.
- Kullanici yalnizca kendi profil, analiz ve CV kayitlarina erisebilir.
- PII iceren loglar maskelenir veya kisaltilir.
- Agent tool'lari `user_id` baglamindan bagimsiz veri okuyamaz.
- Prompt injection riski nedeniyle is ilani metni guvenilmeyen input kabul edilir.
- Extension'dan gelen sayfa metni normalize edilir ve agent'a sistem talimati olarak degil, kullanici/veri girdisi olarak verilir.
- Agent'a shell veya unrestricted filesystem tool'u verilmez.

## Hata Yonetimi

Hata tipleri ayrilmalidir:

- Validation hatasi: 422 veya domain seviyesinde duzeltilebilir hata.
- Auth hatasi: 401/403.
- Kayit bulunamadi: 404.
- LLM provider hatasi: 502/503 benzeri gecici hata.
- Agent validation hatasi: kontrollu retry sonrasi 500 veya kullaniciya tekrar deneme mesaji.
- Timeout: 504 veya uygulama seviyesinde tekrar deneme onerisi.

Agent workflow icinde retry politikasi sinirli olmalidir. Sonsuz retry veya belirsiz tekrarlar kullanilmaz.

## Test Stratejisi

Testler risk seviyesine gore katmanlanir:

- Schema testleri: Pydantic modelleri ve validation kurallari.
- Service unit testleri: Agent client mock'lanarak use-case akislari.
- Tool testleri: Tool input/output ve yetki kontrolleri.
- API testleri: FastAPI test client ile endpoint sozlesmeleri.
- Golden output testleri: Sabit profil + sabit is ilani icin analiz ve CV ciktisinin beklenen yapiyi korumasi.
- Agent evaluation testleri: Kritik senaryolarda LLM sonucunun schema, kapsam ve guvenlik kriterlerine uymasi.

LLM gerektiren testler standart unit test pipeline'inda zorunlu olmamalidir. CI icin deterministic mock ve fixture'lar kullanilir; LLM evaluation ayrik calistirilir.

## Ilk Surum Kapsami

Ilk surum icin onerilen server kapsami:

1. Profil chatbot endpoint'i.
2. Profil taslagi ve eksik alan modeli.
3. Is ilani analiz endpoint'i.
4. Ilana gore yapilandirilmis analiz modeli.
5. CV uretim endpoint'i.
6. ATS uyumlu yapilandirilmis CV modeli.
7. Deep Agents tabanli agent harness.
8. LangGraph thread/checkpoint kimligi stratejisi.
9. Pydantic structured output dogrulamasi.
10. Temel trace/log kayitlari.

Ilk surum disi:

- Queue/worker tabanli background job sistemi.
- Gercek zamanli streaming UI.
- Coklu CV template renderer.
- Gelismis human-in-the-loop onay ekranlari.
- Agent sandbox veya shell execution.

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
