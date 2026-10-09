# Panduan copy – forever-young

Semua teks UI lewat `src/copy/id.ts`. Bahasa Indonesia, sapaan **"kamu"**.

## Daftar dan pemisah

- **Daftar nama sumber / item setara** memakai **koma + spasi**: `NASA FIRMS, BMKG, Open-Meteo`.
- Tanda **·** (titik tengah) hanya untuk **data pendek berpasangan** di satu baris (provinsi · koordinat, skor · label singkat). Jangan pakai · untuk daftar sumber.
- Spasi tunggal di kedua sisi pemisah: `" · "`, bukan `"·"` menempel.

## EmptyState

Satu komponen `EmptyState` untuk kosong / galat. Judul `body-strong`, deskripsi `small` ink-2. Tombol aksi opsional (sm).

## Footer atribusi panel

`Sumber data:` + tautan nama sumber dipisah koma. Bukan `Data: A · B · C`.
