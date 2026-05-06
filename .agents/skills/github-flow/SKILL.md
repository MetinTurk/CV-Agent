---
name: github-flow
description: Use this skill for every CV-Agent development task that changes code, tests, documentation, configuration, UI, API, database behavior, or repository workflow. Enforces the mandatory GitHub Flow: create an issue, create a branch, share the issue link, implement, open a PR, complete Codex and user review, merge, and close the issue.
---

# GitHub Flow

CV-Agent geliştirmesinde GitHub Flow zorunludur. Kod, test, dokümantasyon, konfigürasyon, UI, API, database veya repo iş akışı değişikliği yapılacaksa bu skill kullanılmalıdır.

## Zorunlu Sıra

1. Issue oluştur.
2. Branch oluştur.
3. Issue linkini kullanıcıyla paylaş.
4. İşi implemente et.
5. Doğrula ve atomic commit at.
6. Branch'i push'la.
7. PR aç.
8. Codex review ve user review tamamla.
9. Merge et.
10. Issue kapat.

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

Commit atıldıktan sonra branch remote'a push'lanır:

```bash
git push -u origin codex/<issue-number>-<short-slug>
```

Yerel branch adı slash içermeyen fallback formatındaysa aynı ad push komutunda kullanılır:

```bash
git push -u origin codex-<issue-number>-<short-slug>
```

Push başarılı olduktan sonra kullanıcıya remote branch adı söylenir. Push başarısız olursa hata nedeni özetlenir, kullanıcıdan yetki/remote problemi için aksiyon istenir ve PR adımına geçilmez.

## PR Kuralı

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
