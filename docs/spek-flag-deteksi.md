# Spek algoritma — flag Deteksi di pin

Flag muncul **hanya** saat pin wilayah terpilih (setelah klik). Hover pin menampilkan **nama kab/kota**.

**Pemisahan peran:** flag peta = nama + provinsi + suhu/ikon cuaca + ikon kualitas udara. Panel detail = waktu deteksi, risiko, saran, FWI, kelembapan, angin, hari kering. Satu fakta = satu tempat.

**UI:** callout putih `bg-surface` + `shadow-md`, panah ke pin, jarak `mb-8` agar tidak numpuk halo.

## Keluaran flag

```
Kab. Merauke                    ← judul (nama)
Provinsi Papua Selatan          ← subtitle
☀ 30°C    ☁ Baik                ← suhu + ikon cuaca · ikon udara + label
```

| Bagian       | Isi                         | Aturan                                                     |
| ------------ | --------------------------- | ---------------------------------------------------------- |
| **Judul**    | `region.name`               | Dengan awalan Kab./Kota bila ada di data.                  |
| **Subtitle** | Provinsi                    | `"Provinsi {province}"`.                                   |
| **Cuaca**    | Ikon + suhu °C              | Ikon dari `weather.condition`; suhu dari `weather.temp_c`. |
| **Udara**    | Ikon kabut + label kategori | Label singkat dari `air_quality.category`.                 |

## Panel detail (sidebar)

| Bagian      | Isi                                 | Aturan                                                                                      |
| ----------- | ----------------------------------- | ------------------------------------------------------------------------------------------- |
| **Deteksi** | Waktu deteksi terakhir              | Di bawah provinsi. Zona `region.time_zone`, format `D MMMM YYYY HH:mm:ss`. Label "Deteksi". |
| **Kondisi** | FWI, kelembapan, angin, hari kering | **Tanpa** tile suhu/cuaca dan kualitas udara (sudah di flag).                               |

## Catatan

- Sumber satelit, desa/kecamatan, jumlah titik panas, FRP, dan keyakinan **tidak** di flag.
- Waktu deteksi hanya di sidebar detail.
- Suhu dan kualitas udara **hanya** di flag, tidak diulang di panel kondisi.
