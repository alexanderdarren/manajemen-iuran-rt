import { getItem, saveDoc } from './storage.js';

const KEY = 'pembayaran';

export async function getAllPembayaran() {
  return await getItem(KEY, []);
}

/**
 * Catat pembayaran cash — langsung set status ke 'lunas'.
 * @param {string} tagihanId
 */
export async function catatPembayaranCash(tagihanId) {
  const list = await getAllPembayaran();
  const target = list.find(p => p.tagihan_id === tagihanId);
  if (!target) return null;

  const updated = {
    ...target,
    metode: 'cash',
    status: 'lunas', // cash → langsung lunas, tidak perlu konfirmasi
    tanggal_bayar: new Date().toISOString(),
    tanggal_konfirmasi: new Date().toISOString(),
  };
  await saveDoc(KEY, target.id, updated);
  return updated;
}

/**
 * Catat pembayaran transfer.
 * Status jadi 'menunggu_konfirmasi' sampai admin konfirmasi manual.
 * @param {string} tagihanId
 * @param {string} buktiUrl - URL atau nama file bukti transfer (bisa string kosong)
 */
export async function catatPembayaranTransfer(tagihanId, buktiUrl = '') {
  const list = await getAllPembayaran();
  const target = list.find(p => p.tagihan_id === tagihanId);
  if (!target) return null;

  const updated = {
    ...target,
    metode: 'transfer',
    status: 'menunggu_konfirmasi', // tunggu admin cek mutasi & konfirmasi
    bukti_transfer_url: buktiUrl || null,
    tanggal_bayar: new Date().toISOString(),
    tanggal_konfirmasi: null, // belum dikonfirmasi
  };
  await saveDoc(KEY, target.id, updated);
  return updated;
}

/**
 * Admin mengonfirmasi transfer — set status ke 'lunas'.
 * Dipanggil setelah admin mengecek mutasi rekening dan bukti transfer cocok.
 * @param {string} tagihanId
 */
export async function konfirmasiTransfer(tagihanId) {
  const list = await getAllPembayaran();
  const target = list.find(p => p.tagihan_id === tagihanId);
  if (!target) return null;

  const updated = {
    ...target,
    status: 'lunas', // terkonfirmasi → masuk hitungan kas
    tanggal_konfirmasi: new Date().toISOString(),
  };
  await saveDoc(KEY, target.id, updated);
  return updated;
}

/**
 * Reset pembayaran ke status 'belum' (misal: pembatalan atau salah catat).
 * @param {string} tagihanId
 */
export async function resetPembayaran(tagihanId) {
  const list = await getAllPembayaran();
  const target = list.find(p => p.tagihan_id === tagihanId);
  if (!target) return null;

  const updated = {
    ...target,
    metode: null,
    status: 'belum',
    bukti_transfer_url: null,
    tanggal_bayar: null,
    tanggal_konfirmasi: null,
  };
  await saveDoc(KEY, target.id, updated);
  return updated;
}
