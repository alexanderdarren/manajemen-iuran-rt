import { getItem, saveDocsBatch } from './storage.js';
import { getWarga } from './warga.js';

const KEY_TAGIHAN = 'tagihan';
const KEY_PEMBAYARAN = 'pembayaran';

/** Ambil semua tagihan. */
export async function getAllTagihan() {
  return await getItem(KEY_TAGIHAN, []);
}

/** Ambil semua pembayaran. */
export async function getAllPembayaran() {
  return await getItem(KEY_PEMBAYARAN, []);
}

/**
 * Cek apakah tagihan bulan tertentu sudah pernah di-generate.
 * @param {number} bulan - 1–12
 * @param {number} tahun
 */
export async function isTagihanSudahGenerate(bulan, tahun) {
  const semua = await getAllTagihan();
  return semua.some(
    t => t.bulan === bulan && t.tahun === tahun
  );
}

/**
 * Generate tagihan bulanan untuk semua warga aktif.
 * Mengambil nominal_iuran dari data warga saat ini (bukan nilai historis).
 * Kalau bulan tersebut sudah punya tagihan, function ini tidak akan menambah duplikat.
 *
 * @param {number} bulan - 1–12
 * @param {number} tahun
 * @returns {Promise<{ tagihan: TagihanBulanan[], pembayaran: Pembayaran[], sudahAda: boolean }>}
 */
export async function generateTagihanBulanan(bulan, tahun) {
  const sudahAda = await isTagihanSudahGenerate(bulan, tahun);
  if (sudahAda) {
    return { tagihan: [], pembayaran: [], sudahAda: true };
  }

  const wargaList = await getWarga();
  const semuaWarga = wargaList.filter(w => w.aktif);

  const tagihanBaru = [];
  const pembayaranBaru = [];

  for (const warga of semuaWarga) {
    const tagihan = {
      id: crypto.randomUUID(),
      warga_id: warga.id,
      bulan: bulan,
      tahun: tahun,
      nominal_tagihan: warga.nominal_iuran, // snapshot nominal saat generate
      dibuat_pada: new Date().toISOString(),
    };

    // Buat record pembayaran awal dengan status 'belum'
    const pembayaran = {
      id: crypto.randomUUID(),
      tagihan_id: tagihan.id,
      metode: null,       // null sampai warga bayar
      status: 'belum',    // 'belum' | 'menunggu_konfirmasi' | 'lunas'
      bukti_transfer_url: null,
      tanggal_bayar: null,
      tanggal_konfirmasi: null,
    };

    tagihanBaru.push(tagihan);
    pembayaranBaru.push(pembayaran);
  }

  await saveDocsBatch(KEY_TAGIHAN, tagihanBaru);
  await saveDocsBatch(KEY_PEMBAYARAN, pembayaranBaru);

  return { tagihan: tagihanBaru, pembayaran: pembayaranBaru, sudahAda: false };
}

/**
 * Ambil tagihan + status pembayaran untuk bulan tertentu,
 * digabungkan dengan data warga.
 * Mengembalikan array objek { tagihan, pembayaran, warga }.
 */
export async function getTagihanDenganStatusBulan(bulan, tahun) {
  const allTagihan = await getAllTagihan();
  const semuaTagihan = allTagihan.filter(t => t.bulan === bulan && t.tahun === tahun);
  const semuaPembayaran = await getAllPembayaran();
  const semuaWarga = await getWarga();

  return semuaTagihan
    .map(tagihan => {
      const pembayaran = semuaPembayaran.find(p => p.tagihan_id === tagihan.id) || null;
      const warga = semuaWarga.find(w => w.id === tagihan.warga_id) || null;
      return { tagihan, pembayaran, warga };
    })
    .sort((a, b) => {
      const blokA = a.warga?.no_blok || '';
      const blokB = b.warga?.no_blok || '';
      const cmp = blokA.localeCompare(blokB, undefined, { numeric: true, sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return (a.warga?.nama || '').localeCompare(b.warga?.nama || '', undefined, { sensitivity: 'base' });
    });
}

/**
 * Ambil semua tagihan + pembayaran + warga (untuk halaman Riwayat).
 * Bisa difilter opsional per warga_id dan/atau bulan+tahun.
 */
export async function getRiwayatPembayaran({ warga_id, bulan, tahun } = {}) {
  let semuaTagihan = await getAllTagihan();
  const semuaPembayaran = await getAllPembayaran();
  const semuaWarga = await getWarga();

  if (warga_id) semuaTagihan = semuaTagihan.filter(t => t.warga_id === warga_id);
  if (bulan) semuaTagihan = semuaTagihan.filter(t => t.bulan === Number(bulan));
  if (tahun) semuaTagihan = semuaTagihan.filter(t => t.tahun === Number(tahun));

  return semuaTagihan
    .map(tagihan => {
      const pembayaran = semuaPembayaran.find(p => p.tagihan_id === tagihan.id) || null;
      const warga = semuaWarga.find(w => w.id === tagihan.warga_id) || null;
      return { tagihan, pembayaran, warga };
    })
    // Urutkan: terbaru dulu
    .sort((a, b) => {
      if (b.tagihan.tahun !== a.tagihan.tahun) return b.tagihan.tahun - a.tagihan.tahun;
      return b.tagihan.bulan - a.tagihan.bulan;
    });
}

/**
 * Ambil daftar bulan-tahun yang punya tagihan (untuk dropdown filter).
 * Mengembalikan array { bulan, tahun } diurutkan terbaru dulu.
 */
export async function getDaftarBulanTagihan() {
  const semuaTagihan = await getAllTagihan();
  const unik = new Map();
  for (const t of semuaTagihan) {
    const key = `${t.tahun}-${t.bulan}`;
    if (!unik.has(key)) unik.set(key, { bulan: t.bulan, tahun: t.tahun });
  }
  return [...unik.values()].sort((a, b) => {
    if (b.tahun !== a.tahun) return b.tahun - a.tahun;
    return b.bulan - a.bulan;
  });
}
