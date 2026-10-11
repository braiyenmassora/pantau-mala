# Spek algoritma — flag Deteksi di pin

Flag muncul **hanya** saat pin wilayah terpilih (setelah klik). Hover pin menampilkan **nama kab/kota**.

**Pemisahan peran:** flag peta = nama + provinsi. Panel detail = waktu deteksi, risiko, saran, cuaca, kualitas udara. Satu fakta = satu tempat.

**UI:** callout putih `bg-surface` + `shadow-md`, panah ke pin, jarak `mb-8` agar tidak numpuk halo. Judul + subtitle (tanpa ikon).

## Keluaran flag

```
Kab. Merauke                    ← judul (nama)
Provinsi Papua Selatan          ← subtitle
```

| Bagian       | Isi           | Aturan                                    |
| ------------ | ------------- | ----------------------------------------- |
| **Judul**    | `region.name` | Dengan awalan Kab./Kota bila ada di data. |
| **Subtitle** | Provinsi      | `"Provinsi {province}"`.                  |

## Panel detail (sidebar)

| Bagian      | Isi                    | Aturan                                                                                      |
| ----------- | ---------------------- | ------------------------------------------------------------------------------------------- |
| **Deteksi** | Waktu deteksi terakhir | Di bawah provinsi. Zona `region.time_zone`, format `D MMMM YYYY HH:mm:ss`. Label "Deteksi". |

## Catatan

- Sumber satelit, desa/kecamatan, jumlah titik panas, FRP, keyakinan, dan kualitas udara **tidak** di flag.
- Waktu deteksi hanya di sidebar detail.
