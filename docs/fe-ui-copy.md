# pantau-mala — panduan UI copy, ikon, tooltip (FE)

|                    |                                           |
| ------------------ | ----------------------------------------- |
| **Versi**          | 1.0 — 11 Oktober 2026                     |
| **Audiens**        | FE / AI yang mengerjakan UI               |
| **Data & kontrak** | [`prd-fe.md`](prd-fe.md) (jangan bentrok) |

Tujuan: teks singkat, layout bersih, ikon konsisten, **tidak menyesatkan masyarakat**.

Salin file ini ke repo FE atau tempel ke prompt AI FE bersama `prd-fe.md`.

---

## 1. Prinsip anti-menyesatkan (paling penting)

Informasi publik. Salah kata = orang bisa panik atau salah bertindak.

| Boleh                                        | Jangan                                             |
| -------------------------------------------- | -------------------------------------------------- |
| “Titik panas terdeteksi satelit”             | “Ada kebakaran di …” (kecuali sumber resmi lain)   |
| “Risiko berdasarkan jumlah titik panas”      | “Wilayah dalam bahaya ekstrem / evakuasi sekarang” |
| “Perkiraan / gambaran” untuk cuaca-udara     | Menyajikan FWI/PM2.5 seolah skor risiko resmi BMKG |
| “Data diperbarui setiap ~3 jam”              | “Live real-time detik ini”                         |
| Arahkan Damkar 113 / 112 lewat `actions` API | Menambah instruksi darurat yang tidak ada di API   |

**Aturan emas:** titik panas ≠ kebakaran. Ulangi di legend singkat atau footnote UI sekali — jangan diulang di setiap chip.

Sebelum ship copy, tanya: _Kalau dibaca warga tanpa konteks teknis, apakah mereka mengira rumah mereka terbakar?_ Jika ya → tulis ulang.

---

## 2. Copywriting — bahasa manusia, bukan AI

1. Pendek. Satu ide per baris. Potong kata yang tidak mengubah arti.
2. Sentence case, kata kerja aktif, bahasa sehari-hari.
3. Satu istilah = satu konsep di seluruh app (lihat kamus §4).
4. Jangan bunyi chatbot: “Mari kita…”, “Dalam rangka…”, “Penting untuk dicatat bahwa…”, emoji beruntun, slogan.
5. Tampilkan `summary` / `actions` dari API apa adanya; jangan di-dramatisasi.
6. Empty/error: apa yang terjadi + apa yang bisa dilakukan. Tanpa minta maaf panjang.

### Contoh nada

| Terlalu AI / menyesatkan                                      | Lebih manusiawi                                 |
| ------------------------------------------------------------- | ----------------------------------------------- |
| “Sistem mendeteksi anomali termal signifikan di wilayah Anda” | “Ada beberapa titik panas di wilayah ini”       |
| “Segera evakuasi — risiko sangat kritis!”                     | (pakai `actions` dari API; jangan tambah panik) |
| “Utilizing satellite-derived hotspots…”                       | “Dari satelit NASA FIRMS”                       |
| “Data sedang diproses untuk pengalaman terbaik Anda”          | “Memuat data…”                                  |

---

## 3. Ikon — satu pattern di seluruh app

1. **Satu library / satu set** (mis. Lucide _atau_ Phosphor _atau_ Heroicons — jangan campur gaya outline vs filled).
2. **Satu stroke weight** dan ukuran per peran:
   - inline dengan label: 16–18px
   - tombol ikon: 20px
   - legend peta: ukuran tetap, sama di mobile/desktop
3. **Arti tetap:** satu makna = satu ikon di semua layar (cari, filter, lokasi, info, tutup).
4. Ikon **melengkapi** label, bukan mengganti arti. Tombol penting tetap punya teks (kecuali icon-only yang punya `aria-label`).
5. **Risiko / titik panas = lingkaran (circle) berwarna**, bukan api/flame — flame menyesatkan seolah kebakaran aktif.
6. Warna ikon mengikuti token status (sedang / sangat tinggi / netral), bukan warna acak per komponen.
7. Info (`ⓘ`): **hanya** untuk penjelasan singkat; pattern sama di mana pun muncul (ukuran, posisi kanan label, hover/focus/tap).

### Pattern tooltip info (`ⓘ`)

| Aturan        | Isi                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------- |
| Kapan         | Hanya jika tanpa tooltip user bisa salah paham                                              |
| Panjang       | 1–2 kalimat. Max ~160 karakter.                                                             |
| Nada          | Manusia, faktual, tenang                                                                    |
| Bukan         | Paragraf disclaimer legal, daftar ambang FWI panjang, jargon                                |
| Aksesibilitas | Bisa keyboard; `aria-describedby` / label jelas; bukan hover-only di mobile (tap toggle OK) |
| Konsistensi   | Komponen tooltip yang sama di risiko, cuaca, udara, badge update                            |

**Contoh tooltip risiko (disetujui):**  
“Makin banyak titik panas dari satelit NASA FIRMS (24 jam), makin tinggi risikonya di peta. Titik panas belum tentu kebakaran.”

**Contoh tooltip cuaca/udara (jika ditampil):**  
“Cuaca dan kualitas udara untuk gambaran saja — tidak mengatur warna pin di peta.”

**Contoh tooltip diperbarui:**  
“Data diganti setiap sekitar 3 jam dari satelit dan cuaca.”

---

## 4. Kamus label (wajib konsisten)

| UI                          | Copy                                                |
| --------------------------- | --------------------------------------------------- |
| Pin / chip sedang           | Sedang                                              |
| Pin / chip sangat tinggi    | Sangat tinggi                                       |
| Kartu count                 | Titik panas 24 jam                                  |
| Badge waktu                 | Diperbarui … / setiap ~3 jam                        |
| Catalog tanpa match regions | Tidak ada titik panas aktif                         |
| Nearby                      | Titik panas dalam 25 km                             |
| Gagal load                  | Gagal memuat data. Coba lagi.                       |
| Izinkan lokasi              | Izinkan lokasi untuk melihat titik panas dekat Anda |
| Loading                     | Memuat data…                                        |

Hindari di label utama: “hotspot”, “api”, “kebakaran”, “anomali termal”, “BREAKING”, ALL CAPS, emoji berlebihan.

---

## 5. Layout clean (ringkas)

1. Satu pekerjaan per section; peta = fokus utama.
2. Hierarki: angka penting → nama wilayah → teks pendukung.
3. Sedikit elemen; hapus chip/badge/ikon dekoratif.
4. Spacing skala 4/8; jangan card-dalam-card.
5. Max 2 font family; motion hanya untuk feedback interaksi.
6. Hindari look generik AI (cream+terracotta, ungu glow, pill cluster, stat strip ramai).

---

## 6. Checklist sebelum merge UI

- [ ] Tidak menyamakan titik panas = kebakaran
- [ ] Tidak ada UI tren 7 hari (lihat prd-fe)
- [ ] Satu set ikon + arti konsisten
- [ ] Semua `ⓘ` pakai komponen/pattern sama; copy 1–2 kalimat, bahasa manusia
- [ ] Tidak menambah instruksi darurat di luar `actions` API
- [ ] Tidak mengklaim real-time atau sumber resmi BMKG untuk pin
- [ ] Empty/error jelas dan tenang
- [ ] Mobile: tooltip/info bisa diakses tanpa hover

---

## 7. Prompt siap tempel (AI FE)

```text
Kerjakan UI pantau-mala mengikuti docs/prd-fe.md + docs/fe-ui-copy.md.
Standarisasi copy ringkas, layout clean, ikon satu pattern, tooltip ⓘ konsisten.
Bahasa manusia (bukan nada AI). Jangan menyesatkan: titik panas ≠ kebakaran;
jangan panik; jangan klaim kebakaran/real-time/BMKG untuk warna pin.
Jangan tampilkan tren 7 hari. Perubahan terkecil yang merapikan seluruh app.
Self-check: bisa dipotong? menakut-nakuti? menyesatkan warga awam?
```

---

_FE UI copy v1.0 — ikon konsisten, tooltip manusiawi, anti-misinfo publik._
