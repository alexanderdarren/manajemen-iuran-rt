/**
 * kas.js
 * Kalkulasi kas bulanan RT (Async Firestore).
 *
 * ATURAN UTAMA (jangan diubah tanpa sadar implikasinya):
 * Total terkumpul = SUM nominal_tagihan dari semua pembayaran berstatus 'lunas',
 * baik yang dibayar cash maupun transfer yang sudah dikonfirmasi.
 * Pembayaran berstatus 'belum' atau 'menunggu_konfirmasi' TIDAK dihitung.
 *
 * Split:
 *   Kas RT  = 15% dari total_terkumpul
 *   Setor RW = 85% dari total_terkumpul
 */

import { getAllTagihan, getAllPembayaran } from './tagihan.js';

/**
 * Hitung kas untuk bulan dan tahun tertentu.
 * @param {number} bulan - 1–12
 * @param {number} tahun
 * @returns {Promise<{ total_terkumpul: number, kas_rt: number, setor_rw: number, jumlah_lunas: number, jumlah_belum: number, jumlah_menunggu: number, total_tagihan: number }>}
 */
export async function hitungKasBulan(bulan, tahun) {
  // Ambil semua tagihan bulan ini
  const allTagihan = await getAllTagihan();
  const tagihan = allTagihan.filter(
    t => t.bulan === bulan && t.tahun === tahun
  );

  // Ambil semua pembayaran
  const semuaPembayaran = await getAllPembayaran();

  let total_terkumpul = 0;
  let jumlah_lunas = 0;
  let jumlah_menunggu = 0;
  let jumlah_belum = 0;

  for (const t of tagihan) {
    const p = semuaPembayaran.find(p => p.tagihan_id === t.id);
    if (!p) {
      jumlah_belum++;
      continue;
    }

    if (p.status === 'lunas') {
      // Masukkan ke total — ini berlaku untuk SEMUA metode (cash & transfer)
      total_terkumpul += t.nominal_tagihan;
      jumlah_lunas++;
    } else if (p.status === 'menunggu_konfirmasi') {
      jumlah_menunggu++;
    } else {
      jumlah_belum++;
    }
  }

  // Split 15% kas RT, 85% setor RW
  const kas_rt = Math.round(total_terkumpul * 0.15);
  const setor_rw = Math.round(total_terkumpul * 0.85);

  return {
    total_terkumpul,
    kas_rt,
    setor_rw,
    jumlah_lunas,
    jumlah_menunggu,
    jumlah_belum,
    total_tagihan: tagihan.length,
  };
}

/**
 * Ambil ringkasan kas untuk semua bulan yang punya tagihan.
 * Berguna untuk halaman Laporan.
 * @returns {Promise<Array>} array { bulan, tahun, ...hasil hitungKasBulan }
 */
export async function getRingkasanKasSemua() {
  const semuaTagihan = await getAllTagihan();

  // Kumpulkan bulan-tahun unik
  const bulanTahunSet = new Map();
  for (const t of semuaTagihan) {
    const key = `${t.tahun}-${String(t.bulan).padStart(2, '0')}`;
    if (!bulanTahunSet.has(key)) {
      bulanTahunSet.set(key, { bulan: t.bulan, tahun: t.tahun });
    }
  }

  const sortedList = [...bulanTahunSet.values()].sort((a, b) => {
    if (b.tahun !== a.tahun) return b.tahun - a.tahun;
    return b.bulan - a.bulan;
  });

  const hasil = [];
  for (const { bulan, tahun } of sortedList) {
    const hitungan = await hitungKasBulan(bulan, tahun);
    hasil.push({
      bulan,
      tahun,
      ...hitungan,
    });
  }

  return hasil;
}
