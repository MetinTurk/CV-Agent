# Career Co-pilot Chrome Extension

Bu klasör jüri demosu için statik Chrome MV3 eklenti arayüzünü içerir. Popup, `POST /api/job-analyses` endpoint'ine istek atar; API kapalıysa aynı akışı yerel demo verisiyle tamamlar.

## Hızlı Önizleme

`apps/chrome-extension/preview.html` dosyasını tarayıcıda açarak gönderilen mockup'a yakın sunum görünümünü gösterebilirsiniz.

## Chrome'a Yükleme

1. Chrome'da `chrome://extensions` sayfasını açın.
2. Developer Mode seçeneğini aktif edin.
3. `Load unpacked` ile `apps/chrome-extension` klasörünü seçin.
4. Backend açıksa popup `http://localhost:3000/api/job-analyses` endpoint'ini kullanır.

## Demo API

```http
POST http://localhost:3000/api/job-analyses
```

Backend cevap verdiğinde popup analiz skorunu ve web uygulaması yönlendirmesini gösterir. Backend kapalıysa sunum akışı kesilmeden yerel demo sonucu gösterilir.
