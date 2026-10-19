# Istilah baku pantau-mala (client masyarakat)

Satu istilah untuk satu konsep. Pakai ini di copy UI, tip, share, dan meta. Sumber teks: `src/copy/id.ts` dan `RISK_CATEGORIES` di `src/lib/risk-category.ts`.

| Istilah                                              | Arti                                                                                                                                                                   | Jangan bilang / jangan samakan dengan                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Titik panas**                                      | Deteksi panas satelit NASA FIRMS                                                                                                                                       | Api, kebakaran aktif, konfirmasi kebakaran                                            |
| **Terdeteksi**                                       | Satelit mencatat sinyal panas (bukan “tidak ada kejadian”)                                                                                                             | “Tidak ada api”, “aman”, “bersih”                                                     |
| **Risiko**                                           | Kategori dari jumlah titik panas 24 jam di wilayah (hanya bila ada titik)                                                                                              | Kualitas udara, FWI, peringatan resmi, nol titik                                      |
| **Tidak ada titik panas terdeteksi** (`tanpa_titik`) | Status FE bila hitungan 24 jam = **0** valid. Label yang sama di **badge**, **pin/hover**, dan **legenda** (titik abu). Hanya di filter **Semua**, urutan paling bawah | “Tanpa titik”, Risiko Rendah, hijau, “aman”; chip filter sendiri (tidak ada)          |
| **Belum dinilai** (`tidak_tersedia`)                 | Hitungan null/undefined/gagal dimuat, atau agregat tanpa data                                                                                                          | Nol titik terkonfirmasi; jangan isi choropleth abu                                    |
| **Keyakinan** / **keyakinan deteksi**                | Seberapa yakin satelit bahwa lokasi itu panas                                                                                                                          | Tingkat bahaya atau risiko kebakaran                                                  |
| **Estimasi**                                         | Nilai model (udara, cuaca), bukan pengukuran stasiun                                                                                                                   | “Resmi”, “stasiun”, “pasti”                                                           |
| **Kualitas udara**                                   | Estimasi PM2.5 / kategori model                                                                                                                                        | Badge risiko titik panas; label “Sedang” tanpa penanda di luar kartu udara            |
| **Wilayah**                                          | Kabupaten/kota (unit pantauan utama)                                                                                                                                   | Provinsi (agregat), desa                                                              |
| **Provinsi**                                         | Agregat kab/kota; badge = risiko/status terburuk di dalamnya                                                                                                           | Satu kab/kota                                                                         |
| **Dekat kamu**                                       | Titik panas dalam radius 25 km dari lokasi pengguna                                                                                                                    | Pantauan nasional penuh                                                               |
| **Sumber resmi**                                     | Portal BMKG, BNPB, SiPongi+, Darurat 112 (kartu detail wilayah)                                                                                                        | Sumber data satelit FIRMS di footer                                                   |
| **Data usang / terlambat**                           | Pembaruan sumber terlambat atau gagal                                                                                                                                  | “Data terbaru”, “real-time”; jangan tampilkan abu nol titik sebagai konfirmasi kosong |
| **Orbit / cakupan satelit**                          | Satelit tidak memantau terus-menerus                                                                                                                                   | Hanya tampil saat **nol** titik terdeteksi                                            |

## Legenda peta (Tingkat risiko)

Urutan baris: **Sangat tinggi**, **Sedang**, **Rendah**, **Tidak ada titik panas terdeteksi** (abu). Tanpa baris penjelasan tambahan di bawah.

## Filter risiko

Chip: **Semua**, **Sangat tinggi**, **Sedang**, **Rendah**. Wilayah nol titik dan belum dinilai hanya muncul di **Semua**. Chip Rendah tidak memuat wilayah nol titik.

## Label yang mudah bentrok

- **Sedang (risiko)** vs **Sedang (udara):** di kartu udara boleh “Sedang”; di flag pin / dekat badge risiko pakai “Sedang (udara)” atau “… (estimasi)”.
- **Disclaimer baku:** `Bukan konfirmasi kebakaran atau peringatan resmi.` Satu baris terlihat di konteks yang menampilkan badge risiko; ⓘ tidak mengulang kalimat itu.
- **Share:** satu teks netral (nama + pantauan satelit + disclaimer + tautan). Jangan sebut status titik atau angka.
- **Tanda pisah:** jangan pakai em dash (—) di copy yang terlihat. Pakai titik, koma, atau middle dot (·).

## Frasa orbit baku

`Satelit tidak memantau terus-menerus. Tidak ada titik terdeteksi belum tentu berarti tidak ada api.`
