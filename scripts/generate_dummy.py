import json, random, math
random.seed(42)

TZ = {"WIB": "+07:00", "WITA": "+08:00", "WIT": "+09:00"}
# kode wilayah: contoh, cocokkan dengan kode resmi Kemendagri sebelum produksi
REG = [
 # kode, nama, provinsi, tz, lon, lat, skor, trend7, cuaca(suhu,kondisi,rh,angin,dry), pm25
 ("62.11","Kab. Pulang Pisau","Kalimantan Tengah","WIB",114.25,-2.75,82,[8,10,9,14,15,19,23],(34,"Cerah",48,14,9),92.4),
 ("16.02","Kab. Ogan Komering Ilir","Sumatera Selatan","WIB",105.60,-3.40,76,[9,9,11,12,14,15,17],(33,"Berawan",52,11,7),71.0),
 ("62.03","Kab. Kapuas","Kalimantan Tengah","WIB",114.40,-2.10,69,[5,6,6,8,9,11,12],(33,"Cerah",51,12,8),58.2),
 ("15.05","Kab. Muaro Jambi","Jambi","WIB",103.80,-1.60,52,[6,7,9,8,8,7,8],(32,"Berawan",61,8,4),38.5),
 ("14.04","Kab. Pelalawan","Riau","WIB",102.20,0.20,48,[9,8,7,7,6,6,6],(32,"Berawan",63,9,3),31.0),
 ("61.04","Kab. Ketapang","Kalimantan Barat","WIB",110.50,-1.90,41,[2,3,3,4,4,5,5],(31,"Cerah berawan",66,7,3),14.2),
 ("63.03","Kab. Banjar","Kalimantan Selatan","WITA",115.00,-3.30,37,[4,4,5,4,5,4,4],(32,"Berawan",64,10,2),22.8),
 ("64.02","Kab. Kutai Kartanegara","Kalimantan Timur","WITA",116.80,-0.40,29,[3,2,3,3,2,3,3],(31,"Hujan ringan",74,9,1),12.6),
 ("53.10","Kab. Kupang","Nusa Tenggara Timur","WITA",123.90,-10.00,24,[1,2,1,2,2,1,2],(33,"Cerah",58,18,12),9.8),
 ("93.01","Kab. Merauke","Papua Selatan","WIT",140.40,-8.50,18,[4,3,3,2,3,2,2],(30,"Hujan ringan",72,10,1),8.1),
 ("61.12","Kab. Kubu Raya","Kalimantan Barat","WIB",109.40,-0.30,12,[1,1,0,1,1,0,1],(30,"Hujan",80,6,0),7.5),
 ("15.71","Kota Jambi","Jambi","WIB",103.61,-1.61,44,[2,3,3,3,4,3,3],(32,"Berawan",60,8,4),36.0),
 # Sulawesi — beberapa titik sangat tinggi untuk uji peta
 ("73.18","Kab. Tana Toraja","Sulawesi Selatan","WITA",119.85,-3.04,80,[7,9,10,12,14,18,21],(33,"Cerah",47,13,8),88.0),
 ("73.71","Kota Makassar","Sulawesi Selatan","WITA",119.43,-5.15,75,[6,8,9,11,13,16,19],(34,"Cerah berawan",50,12,7),76.5),
 ("71.71","Kota Manado","Sulawesi Utara","WITA",124.84,1.48,72,[5,7,8,10,12,15,18],(32,"Berawan",54,11,6),69.2),
 # Sangat tinggi tambahan — sebaran pulau
 ("31.71","Kota Jakarta Pusat","DKI Jakarta","WIB",106.84,-6.18,88,[10,12,14,16,18,22,26],(35,"Cerah",42,15,11),110.0),
 ("33.74","Kota Semarang","Jawa Tengah","WIB",110.42,-6.97,84,[9,11,12,14,17,20,24],(34,"Cerah",45,14,10),98.5),
 ("53.08","Kab. Ende","Nusa Tenggara Timur","WITA",121.66,-8.84,79,[6,8,9,11,13,16,20],(33,"Cerah",46,16,12),85.0),
 ("91.71","Kota Jayapura","Papua","WIT",140.67,-2.53,86,[8,10,12,14,17,21,25],(32,"Cerah berawan",49,12,9),95.0),
 ("92.03","Kab. Fakfak","Papua Barat","WIT",132.30,-2.92,81,[7,9,10,12,15,18,22],(31,"Berawan",51,11,8),90.0),
]
SATS=["VIIRS NOAA-20","VIIRS SNPP","VIIRS NOAA-21","MODIS Aqua","MODIS Terra"]

def kategori(s): return "rendah" if s<=33 else ("sedang" if s<=66 else "sangat_tinggi")
def udara(pm):  # ambang contoh berbasis ISPU PM2.5, pastikan sebelum produksi
    return "baik" if pm<=15.5 else ("sedang" if pm<=55.4 else "tidak_sehat")
def tren(t):
    a,b=t[0],t[-1]
    if b>a*1.15: return "naik"
    if b<a*0.85: return "turun"
    return "stabil"
def saran(kat, ud):
    s=[]
    if kat=="sangat_tinggi":
        s+=["Jangan membakar lahan, sampah, atau membuang puntung rokok sembarangan.",
            "Bila melihat api, segera hubungi Damkar 113 atau layanan darurat 112."]
    elif kat=="sedang":
        s+=["Hindari membakar lahan atau sampah.","Pantau perkembangan titik panas di wilayah ini."]
    else:
        s+=["Belum perlu tindakan khusus. Tetap hindari membakar lahan."]
    if ud=="tidak_sehat": s.append("Kurangi aktivitas di luar ruangan dan gunakan masker N95.")
    elif ud=="sedang": s.append("Anak, lansia, dan penderita asma sebaiknya mengurangi aktivitas di luar ruangan.")
    return s
def ringkasan(t, rh, dry):
    tr={"naik":"naik","turun":"turun","stabil":"stabil"}[tren(t)]
    hujan = f"{dry} hari tanpa hujan" if dry>0 else "hujan turun dalam 24 jam terakhir"
    return f"Titik panas {tr} dalam 7 hari, kelembapan {rh}%, {hujan}."

wilayah=[]; feats=[]
for kode,nama,prov,tz,lon,lat,skor,t,(suhu,kond,rh,angin,dry),pm in REG:
    hs=t[-1]; kat=kategori(skor); ud=udara(pm)
    pts=[]
    for i in range(hs):
        conf = "tinggi" if (kat=="sangat_tinggi" and random.random()<0.6) else "sedang"
        hh=random.randint(1,13); mm=random.randint(0,59)
        pts.append((round(lon+random.uniform(-0.25,0.25),4), round(lat+random.uniform(-0.2,0.2),4),
                    f"2026-10-09T{hh:02d}:{mm:02d}:00{TZ[tz]}", random.choice(SATS), conf,
                    round(random.uniform(1.5,6.0) if conf=="sedang" else random.uniform(6.0,22.0),1)))
    # tambahan titik keyakinan rendah (tampil di peta, tidak dihitung)
    for _ in range(random.choice([0,1,2])):
        pts.append((round(lon+random.uniform(-0.3,0.3),4), round(lat+random.uniform(-0.25,0.25),4),
                    f"2026-10-09T{random.randint(1,13):02d}:{random.randint(0,59):02d}:00{TZ[tz]}",
                    random.choice(SATS),"rendah",round(random.uniform(0.8,2.5),1)))
    counted=[p for p in pts if p[4]!="rendah"]
    last=max(counted, key=lambda p:p[2]) if counted else max(pts,key=lambda p:p[2])
    for p in pts:
        feats.append({"type":"Feature","geometry":{"type":"Point","coordinates":[p[0],p[1]]},
                      "properties":{"waktu":p[2],"satelit":p[3],"keyakinan":p[4],"frp_mw":p[5],"kode_wilayah":kode}})
    wilayah.append({
        "kode":kode,"nama":nama,"provinsi":prov,"zona_waktu":tz,"pusat":[lon,lat],
        "skor":skor,"kategori":kat,"titik_panas_24j":hs,"tren_7h":t,
        "cuaca":{"suhu_c":suhu,"kondisi":kond,"kelembapan":rh,"angin_kmj":angin,"hari_tanpa_hujan":dry},
        "udara":{"pm25":pm,"kategori":ud},
        "deteksi_terakhir":{"waktu":last[2],"satelit":last[3],"keyakinan":last[4],"frp_mw":last[5]},
        "ringkasan":ringkasan(t,rh,dry),"saran":saran(kat,ud)})
wilayah.sort(key=lambda w:-w["skor"])

from pathlib import Path
out = Path(__file__).resolve().parents[1] / "public" / "data"
out.mkdir(parents=True, exist_ok=True)
json.dump(wilayah, open(out / "wilayah.json", "w"), ensure_ascii=False, indent=2)
json.dump({"type":"FeatureCollection","features":feats}, open(out / "titik-panas-24j.geojson", "w"), ensure_ascii=False, indent=2)
json.dump({"diperbarui":"2026-10-09T14:05:00+07:00","status":{"firms":"ok","cuaca":"ok","udara":"ok"}}, open(out / "meta.json", "w"), ensure_ascii=False, indent=2)
json.dump({"diperbarui":"2026-10-09T11:05:00+07:00","status":{"firms":"terlambat","cuaca":"ok","udara":"gagal"}}, open(out / "meta-bermasalah.json", "w"), ensure_ascii=False, indent=2)
# Katalog pencarian (38 provinsi + kab/kota hotspot + beberapa tanpa titik panas)
PROV_CATALOG = [
 ("11","Aceh",[95.0,2.0,98.3,6.1],[96.9,4.7]),
 ("12","Sumatera Utara",[97.0,1.0,100.5,4.5],[98.7,2.1]),
 ("13","Sumatera Barat",[98.5,-3.5,101.5,0.5],[100.4,-0.9]),
 ("14","Riau",[100.0,-1.2,103.8,2.8],[101.6,0.5]),
 ("15","Jambi",[101.0,-2.8,104.5,-0.5],[103.6,-1.6]),
 ("16","Sumatera Selatan",[102.0,-5.0,106.5,-1.5],[104.8,-3.3]),
 ("17","Bengkulu",[101.0,-5.6,103.8,-2.3],[102.3,-3.8]),
 ("18","Lampung",[103.5,-6.5,106.0,-3.7],[105.2,-5.0]),
 ("19","Kepulauan Bangka Belitung",[105.0,-3.5,109.2,-0.8],[106.1,-2.1]),
 ("21","Kepulauan Riau",[103.0,-0.5,109.5,4.5],[104.5,1.0]),
 ("31","DKI Jakarta",[106.65,-6.4,107.0,-5.95],[106.85,-6.2]),
 ("32","Jawa Barat",[106.3,-7.8,108.9,-5.9],[107.6,-6.9]),
 ("33","Jawa Tengah",[108.5,-8.2,111.8,-6.0],[110.0,-7.2]),
 ("34","DI Yogyakarta",[110.0,-8.2,110.9,-7.5],[110.4,-7.8]),
 ("35","Jawa Timur",[110.9,-8.8,114.7,-6.7],[112.6,-7.5]),
 ("36","Banten",[105.0,-7.0,106.8,-5.7],[106.1,-6.4]),
 ("51","Bali",[114.4,-8.9,115.8,-8.0],[115.1,-8.4]),
 ("52","Nusa Tenggara Barat",[115.7,-9.1,119.4,-8.0],[117.4,-8.6]),
 ("53","Nusa Tenggara Timur",[118.8,-11.2,125.3,-7.5],[121.5,-9.0]),
 ("61","Kalimantan Barat",[108.5,-3.1,114.3,2.1],[111.1,-0.3]),
 ("62","Kalimantan Tengah",[110.7,-3.6,115.9,0.8],[113.5,-1.7]),
 ("63","Kalimantan Selatan",[114.3,-4.2,116.7,-1.3],[115.4,-3.0]),
 ("64","Kalimantan Timur",[113.8,-2.5,119.0,2.5],[116.5,0.5]),
 ("65","Kalimantan Utara",[114.5,1.5,119.2,4.5],[116.5,3.0]),
 ("71","Sulawesi Utara",[123.0,0.3,127.2,5.0],[124.8,1.5]),
 ("72","Sulawesi Tengah",[119.0,-3.5,124.5,1.5],[121.5,-1.0]),
 ("73","Sulawesi Selatan",[116.8,-8.0,122.0,-1.5],[119.9,-4.0]),
 ("74","Sulawesi Tenggara",[120.5,-6.5,124.8,-2.5],[122.5,-4.0]),
 ("75","Gorontalo",[121.0,0.2,123.8,1.5],[122.5,0.7]),
 ("76","Sulawesi Barat",[118.5,-4.0,120.0,-1.0],[119.3,-2.5]),
 ("81","Maluku",[125.5,-8.5,135.0,-2.5],[128.2,-3.7]),
 ("82","Maluku Utara",[124.0,-2.5,129.5,3.0],[127.4,0.8]),
 ("91","Papua",[138.0,-4.0,141.1,-0.5],[140.5,-2.5]),
 ("92","Papua Barat",[129.0,-4.5,135.0,0.5],[132.5,-2.0]),
 ("93","Papua Selatan",[137.0,-9.2,141.1,-4.5],[139.5,-7.5]),
 ("94","Papua Tengah",[134.0,-5.0,139.0,-1.5],[136.5,-3.5]),
 ("95","Papua Pegunungan",[137.5,-5.5,141.0,-2.5],[139.5,-4.0]),
 ("96","Papua Barat Daya",[130.0,-2.5,134.5,1.0],[132.0,-0.5]),
]
EXTRA_KAB = [
 ("81.71","Kota Ambon","Maluku","WIT",[128.18,-3.70]),
 ("81.01","Kab. Maluku Tengah","Maluku","WIT",[129.0,-3.2]),
 ("32.73","Kota Bandung","Jawa Barat","WIB",[107.62,-6.91]),
 ("51.71","Kota Denpasar","Bali","WITA",[115.22,-8.67]),
]
kab_by_kode = {
    w["kode"]: {
        "kode": w["kode"], "nama": w["nama"], "provinsi": w["provinsi"],
        "pusat": w["pusat"], "zona_waktu": w["zona_waktu"],
    }
    for w in wilayah
}
for kode, nama, prov, tz, pusat in EXTRA_KAB:
    kab_by_kode[kode] = {
        "kode": kode, "nama": nama, "provinsi": prov, "pusat": pusat, "zona_waktu": tz,
    }
daftar = {
    "_catatan": "dummy, ganti dari data BIG oleh worker",
    "provinsi": [
        {"kode": k, "nama": n, "bbox": b, "pusat": p} for k, n, b, p in PROV_CATALOG
    ],
    "kabkota": sorted(kab_by_kode.values(), key=lambda x: (x["provinsi"], x["nama"])),
}
json.dump(daftar, open(out / "daftar-wilayah.json", "w"), ensure_ascii=False, indent=2)

days=[sum(w["tren_7h"][i] for w in wilayah) for i in range(7)]
print(len(wilayah),"wilayah;",len(feats),"fitur geojson; total/hari",days)
print(len(daftar["provinsi"]),"provinsi katalog;",len(daftar["kabkota"]),"kabkota katalog")
print({k:sum(1 for w in wilayah if w["kategori"]==k) for k in ["sangat_tinggi","sedang","rendah"]})
print({k:sum(1 for w in wilayah if w["udara"]["kategori"]==k) for k in ["tidak_sehat","sedang","baik"]})
