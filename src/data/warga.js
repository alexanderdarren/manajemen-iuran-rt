/**
 * warga.js
 * CRUD data warga RT (Async Firestore).
 * Setiap warga punya nominal_iuran yang diinput manual —
 * tidak dikalkulasi otomatis dari luas tanah.
 */

import { getItem, saveDoc, deleteDocById } from './storage.js';

const KEY = 'warga';

/** Ambil semua warga, diurutkan default berdasarkan no_blok rumah secara natural. */
export async function getWarga() {
  const list = await getItem(KEY, []);
  return list.sort((a, b) => {
    const blokA = a.no_blok || '';
    const blokB = b.no_blok || '';
    const cmp = blokA.localeCompare(blokB, undefined, { numeric: true, sensitivity: 'base' });
    if (cmp !== 0) return cmp;
    return (a.nama || '').localeCompare(b.nama || '', undefined, { sensitivity: 'base' });
  });
}

/**
 * Tambah warga baru.
 * @param {object} data - { nama, no_blok, luas_tanah, nominal_iuran, catatan }
 */
export async function addWarga(data) {
  const wargaBaru = {
    id: crypto.randomUUID(),
    nama: data.nama.trim(),
    no_blok: data.no_blok.trim(),
    luas_tanah: data.luas_tanah || '',
    nominal_iuran: Number(data.nominal_iuran) || 0,
    catatan: data.catatan || '',
    aktif: true,
    dibuat_pada: new Date().toISOString(),
  };
  await saveDoc(KEY, wargaBaru.id, wargaBaru);
  return wargaBaru;
}

/**
 * Update data warga.
 * Kalau nominal_iuran berubah, tagihan bulan BERIKUTNYA akan otomatis
 * memakai nominal baru (karena tagihan generate dari data warga saat itu).
 * @param {string} id
 * @param {object} perubahan - field yang mau diubah
 */
export async function updateWarga(id, perubahan) {
  const list = await getWarga();
  const target = list.find(w => w.id === id);
  if (!target) return null;

  const updated = {
    ...target,
    ...perubahan,
    nominal_iuran: Number(perubahan.nominal_iuran ?? target.nominal_iuran),
    diubah_pada: new Date().toISOString(),
  };

  await saveDoc(KEY, id, updated);
  return updated;
}

/**
 * Hapus warga (hard delete).
 * Riwayat pembayaran tetap ada karena tersimpan di koleksi terpisah.
 */
export async function deleteWarga(id) {
  await deleteDocById(KEY, id);
}

/** Cari satu warga berdasarkan id. */
export async function getWargaById(id) {
  const list = await getWarga();
  return list.find(w => w.id === id) || null;
}
