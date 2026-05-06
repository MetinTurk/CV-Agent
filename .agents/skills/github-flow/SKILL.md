---
name: github-flow
description: "Use this skill for every CV-Agent development task that changes code, tests, documentation, configuration, UI, API, database behavior, or repository workflow. Enforces the mandatory HTTPS-only GitHub Flow: create an issue, create a branch, share the issue link, implement, open a PR, complete Codex and user review, merge, and close the issue. Never use SSH remotes or git@github.com URLs."
---

# GitHub Flow

## GitHub HTTPS Bağlantı Kuralı

Bu skill kullanıldığında GitHub işlemleri kesinlikle HTTPS üzerinden yapılır. SSH remote, SSH clone URL, `git@github.com:` veya `ssh://git@github.com/` formatı kullanılmaz.

Her issue, branch, commit, push veya PR akışının başında şu kontroller yapılır:

1. `git remote -v` ile `origin` fetch ve push URL'leri kontrol edilir.
2. `origin` fetch ve push URL'leri `https://github.com/<owner>/<repo>.git` formatında değilse düzeltilir.
3. `gh config get git_protocol --host github.com` çıktısı `https` değilse `gh config set git_protocol https --host github.com` çalıştırılır.
4. SSH URL'lerinin tekrar devreye girmesini önlemek için GitHub SSH URL rewrite kuralları kontrol edilir:

```bash
git config --global url.https://github.com/.insteadOf git@github.com:
git config --global --add url.https://github.com/.insteadOf ssh://git@github.com/
```

Bu kontroller tamamlanmadan issue oluşturma, branch açma, push veya PR açma adımına geçilmez. GitHub aracı veya CLI herhangi bir adımda SSH URL üretirse işlem durdurulur, URL HTTPS'e çevrilir ve aynı adım HTTPS ile tekrar denenir.

CV-Agent geliştirmesinde GitHub Flow zorunludur. Kod, test, dokümantasyon, konfigürasyon, UI, API, database veya repo iş akışı değişikliği yapılacaksa bu skill kullanılmalıdır.

## Zorunlu Sıra

1. GitHub HTTPS bağlantı kuralını doğrula.
2. Issue oluştur.
3. Branch oluştur.
4. Issue linkini kullanıcıyla paylaş.
5. İşi implemente et.
6. Doğrula ve atomic commit at.
7. Branch'i HTTPS remote'a push'la.
8. PR'ı HTTPS GitHub bağlantısıyla aç.
9. Codex review ve user review tamamla.
10. Merge et.
11. Issue kapat.

## Yönlendirme Kapıları

Skill yalnızca yapılacak işleri listelemez; her aşamada kullanıcıyı GitHub üzerinde tamamlanması gereken somut adıma yönlendirir veya kullanılabilir GitHub aracı varsa adımı kendisi gerçekleştirir.

Her kapıda şu kurallar uygulanır:

- **Issue kapısı:** Önce kaliteli issue taslağı hazırlanır. GitHub aracı ve gerekli yetki varsa issue oluşturulur ve link paylaşılır. GitHub aracı yoksa veya yetki hatası alınırsa kullanıcıya "Bu issue'yu GitHub üzerinde oluşturun ve issue linkini gönderin." denir; issue linki gelmeden branch veya implementasyon adımına geçilmez.
- **Branch kapısı:** Issue linki alındıktan sonra issue numarasıyla branch oluşturulur. Branch oluşturulamıyorsa kullanıcıya net komut ve branch adı verilir.
- **Implementasyon kapısı:** Branch hazır olmadan dosya değişikliği yapılmaz.
- **Atomic commit kapısı:** Implementasyon sonrası diff incelenir. Değişiklikler tek bir mantıksal işi kapsıyorsa tek atomic commit atılır; birden fazla bağımsız iş varsa kullanıcıya ayrım önerilir ve ayrı atomic commit'ler hazırlanır. Unrelated değişiklikler commit'e dahil edilmez.
- **Push kapısı:** Commit atıldıktan sonra branch remote'a push'lanır. Push yapılamıyorsa kullanıcıya çalıştıracağı komut verilir ve push tamamlanmadan PR adımına geçilmez.
- **PR kapısı:** Implementasyon ve doğrulama tamamlandıktan sonra PR açılır. GitHub aracı yoksa veya yetki hatası alınırsa kullanıcıya PR başlığı, açıklaması ve target branch bilgisi verilir; PR linki istenir.
- **Review kapısı:** PR linki olmadan Codex review yapılmış sayılmaz. Codex review sonucu kullanıcıya bulgu odaklı sunulur ve user review beklenir.
- **Merge kapısı:** User review onayı olmadan merge yapılmaz. GitHub aracı yoksa veya yetki hatası alınırsa kullanıcıya merge etmesi söylenir ve merge sonrası bilgi istenir.
- **Issue kapatma kapısı:** Merge sonrası issue'nun kapandığı doğrulanır. Kapanmadıysa kullanıcıya GitHub üzerinde issue'yu kapatması söylenir veya araç ve yetki varsa kapatılır.

## Sert Kurallar

- Issue açılmadan implementasyona başlanmaz.
- Branch, issue oluşturulduktan sonra açılır ve issue ile ilişkilendirilir.
- Issue linki kullanıcıya verilmeden kod değişikliğine geçilmez.
- Commit atmadan önce `git status` ve diff kontrol edilir.
- Commit'ler atomic olmalıdır; aynı commit içinde ilgisiz değişiklikler karıştırılmaz.
- Kullanıcıya ait mevcut unrelated değişiklikler stage edilmez, revert edilmez ve commit'e alınmaz.
- PR açılmadan önce branch remote'a push'lanmış olmalıdır.
- PR açıklaması issue linkini, test sonucunu ve AI kullanım özetini içerir.
- Codex review, PR açıldıktan sonra diff üzerinde kod inceleme bakışıyla yapılır; bulunan sorunlar merge öncesi düzeltilir.
- User review tamamlanmadan merge yapılmaz.
- Merge sonrası bağlı issue kapatılır veya PR açıklamasındaki closing keyword ile otomatik kapanması doğrulanır.
- GitHub erişimi, label, milestone veya assignee bilgisi eksikse varsayım yapmadan kullanıcıdan net bilgi alınır.

## Issue Kalite Kontrolü

İyi issue şu özellikleri taşımalıdır:

1. Tek bir net işi kapsar.
2. Başlığı açık ve aksiyon odaklıdır.
3. Neden yapıldığını açıklar.
4. Kabul kriterleri ölçülebilirdir.
5. Teknik kapsamı belirgindir.
6. UI/API/database etkileri yazılmıştır.
7. Test beklentisi vardır.
8. İlgili label, milestone ve assignee atanmıştır.
9. Branch ve PR süreciyle bağlanabilir.
10. AI kullanımı takip edilebilir.

## Issue Oluşturma

Issue başlığı aksiyon odaklı olmalıdır:

- `GitHub Flow skill'ini ekle`
- `Analiz sayfası eşleşme skorlarını göster`
- `CV üretim endpoint'ini doğrulama şemalarıyla güçlendir`

Issue gövdesi aşağıdaki template ile oluşturulur.

GitHub issue oluşturulduktan sonra kullanıcıya issue linki açıkça verilmelidir. GitHub issue manuel oluşturulacaksa kullanıcıya aşağıdaki template hazır gövde olarak sunulur ve "GitHub üzerinde bu issue'yu oluşturup linkini gönderin." denir.

```markdown
## Amaç

Bu issue’nun amacı nedir?

## Problem / Gerekçe

Bu iş neden gerekli?

## Kapsam

Bu issue içinde yapılacaklar:
• [ ] ...
• [ ] ...
• [ ] ...

Bu issue dışında kalanlar:
• ...

## Teknik Notlar

Etkilenecek dosyalar, endpoint’ler, component’ler, tablolar.

## Kabul Kriterleri

• [ ] ...
• [ ] ...
• [ ] ...

## Test / Doğrulama

Bu işin doğru çalıştığını nasıl anlayacağız?

## AI Kullanımı / Traceability

Bu issue’da AI hangi amaçla kullanılacak?
• Plan Agent:
• Skills Agent:
• Manuel geliştirilen kısımlar:

## İlgili Bağlantılar

• Tasarım:
• Doküman:
• Bağlı issue:
```

## Branch Kuralı

Branch adı issue numarası ve kısa slug içermelidir:

```text
codex/<issue-number>-<short-slug>
```

Yerel git ortamı slash içeren `codex/...` branch adını desteklemiyorsa `codex-<issue-number>-<short-slug>` kullanılabilir ve sebep kullanıcıya söylenir.

Branch oluşturulduktan sonra kullanıcıya branch adı söylenir. Branch manuel oluşturulacaksa kullanıcıya çalıştıracağı komut verilir:

```bash
git switch -c codex/<issue-number>-<short-slug>
```

## Atomic Commit Kuralı

Commit aşamasında şu sıra izlenir:

1. `git status --short` ile değişiklikler listelenir.
2. Diff okunur ve değişikliklerin issue kapsamıyla uyumlu olduğu doğrulanır.
3. Sadece issue kapsamındaki dosyalar stage edilir.
4. Commit mesajı aksiyon odaklı ve kısa yazılır.
5. Commit mesajında issue numarası referanslanır.

Önerilen commit mesajı formatı:

```text
<type>: <kısa açıklama> (#<issue-number>)
```

Örnekler:

- `docs: add GitHub Flow skill gates (#12)`
- `feat: show job analysis match score (#24)`
- `fix: validate CV generation payload (#31)`

Bir commit yalnızca tek mantıksal değişikliği kapsamalıdır. Aynı issue içinde bağımsız dokümantasyon, UI ve API değişiklikleri varsa ayrı atomic commit'ler tercih edilir.

## Push Kuralı

Commit atıldıktan sonra branch HTTPS remote'a push'lanır. Push öncesi `git remote -v` çıktısında hem fetch hem push URL'si `https://github.com/<owner>/<repo>.git` formatında olmalıdır. SSH URL görülürse önce şu şekilde düzeltilir:

```bash
git remote set-url origin https://github.com/<owner>/<repo>.git
git remote set-url --push origin https://github.com/<owner>/<repo>.git
```

Remote doğrulandıktan sonra push yapılır:

```bash
git push -u origin codex/<issue-number>-<short-slug>
```

Yerel branch adı slash içermeyen fallback formatındaysa aynı ad push komutunda kullanılır:

```bash
git push -u origin codex-<issue-number>-<short-slug>
```

Push başarılı olduktan sonra kullanıcıya remote branch adı söylenir. Push başarısız olursa hata nedeni özetlenir, kullanıcıdan yetki/remote problemi için aksiyon istenir ve PR adımına geçilmez. Hata SSH, public key, permission denied veya `git@github.com` kaynaklıysa SSH ile devam edilmez; remote/protocol HTTPS'e çevrilir ve push HTTPS ile tekrar denenir.

## PR Kuralı

PR açmadan önce `gh config get git_protocol --host github.com` çıktısının `https` olduğu doğrulanır. `gh` veya GitHub aracı SSH URL, SSH clone URL ya da `git@github.com:` formatı önerirse kullanılmaz; PR işlemi HTTPS repo bağlantısı üzerinden tamamlanır.

PR başlığı issue ile aynı işi anlatmalıdır. PR açıklaması şu bilgileri içermelidir:

- Bağlı issue linki ve closing keyword: `Closes #<issue-number>`
- Kapsam özeti
- UI/API/database etkisi
- Test / doğrulama çıktıları
- AI kullanımı / traceability özeti
- Codex review sonucu

## Review ve Merge

PR açıldıktan sonra:

1. Diff incelenir ve Codex review bulguları kullanıcıya aktarılır.
2. Gerekli düzeltmeler aynı branch üzerinde yapılır.
3. Kullanıcıdan review ve merge onayı alınır.
4. PR merge edilir.
5. Issue’nun kapandığı doğrulanır; kapanmadıysa manuel kapatılır.
