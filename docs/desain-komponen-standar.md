# Pola komponen standar (usulan)

Belum diimplementasikan. Satu pola = satu implementasi. Tidak ada hex/inline style di luar token.

| Komponen                       | Tujuan                     | Varian / state                                  | Aturan pakai                                                          |
| ------------------------------ | -------------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| Header / PanelHeaderPill       | Identitas + search/kembali | overview \| detail                              | Tinggi 48; `rounded-card`; merek `pantaumala`                         |
| Peta + MapControls             | Navigasi peta              | default \| lokasi aktif                         | Hit area ≥44px di ≤768px                                              |
| Legend                         | Decode warna               | risiko \| kepadatan \| gempa                    | Selalu teks + warna; bedakan risiko vs kepadatan                      |
| FilterBar / ProvincePicker     | Filter wilayah & risiko    | pressed per chip                                | Satu `Chip`; scroll-x di mobile                                       |
| Badge risiko                   | Label kategori             | Rendah / Sedang / Sangat tinggi / Belum dinilai | Label teks wajib; kelas `bg-risk-*`                                   |
| Kartu statistik / LocationCard | Ringkas dekat kamu         | off \| loading \| empty \| error \| data        | Dimensi kartu tetap antar state                                       |
| Daftar wilayah                 | Peringkat deteksi          | national \| province                            | Angka + label risiko; tanpa ulang frasa penuh                         |
| Tombol                         | Aksi                       | primer \| sekunder \| ghost × sm \| md          | Hanya `common/Button`; deprecate `ui/button` & `rounded-full` di gate |
| Filter / Select                | Pilih nilai                | default \| open \| disabled                     | Placeholder 1–3 kata; opsi jelas                                      |
| Tooltip / MapInfoCard          | Detail titik/pin           | hotspot \| pin \| meta                          | Waktu WIB + sumber di tubuh                                           |
| Banner disclaimer              | Batas interpretasi         | selalu visible                                  | Dekat peta; bukan hanya InfoTooltip                                   |
| Footer / MapSourcesStrip       | Atribusi                   | satu lokasi                                     | FIRMS + Open-Meteo (+ BMKG bila relevan)                              |
| Skeleton / Empty / Error       | State non-data             | loading \| empty \| error \| stale \| offline   | Copy: kejadian + tindakan                                             |

## Hapus duplikasi

1. `common/Button` vs `ui/button` → satu API.
2. `PanelFooter` vs `MapSourcesStrip` → satu strip atribusi dekat peta.
3. Chip di `FilterBar` / `PanelFilters` / daftar → satu `Chip`.
4. Warna risiko via `style={{ backgroundColor }}` → kelas token.

## Urutan PR (Tahap 5)

- **PR A** — tokens + sync `fe-design-system.md` (tanpa ubah logika data).
- **PR B** — komponen chrome (button, chip, badge, banner, footer).
- **PR C** — copy/`id.ts` + `index.html` meta + glosarium di docs.
