const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** Format angka ke format Rupiah. Contoh: 150000 → "150.000" */
export function formatRupiah(nominal) {
  if (nominal === null || nominal === undefined || isNaN(nominal)) return '0';
  return Number(nominal).toLocaleString('id-ID');
}

/** Nama bulan dari nomor 1–12. */
export function namaBulan(bulan) {
  return NAMA_BULAN[(bulan - 1)] || '';
}

/** Format "Mei 2025" dari bulan + tahun. */
export function formatBulanTahun(bulan, tahun) {
  return `${namaBulan(bulan)} ${tahun}`;
}

/** Bulan & tahun saat ini. */
export function bulanTahunSekarang() {
  const now = new Date();
  return { bulan: now.getMonth() + 1, tahun: now.getFullYear() };
}

/**
 * Format tanggal ISO ke string lokal Indonesia.
 * Contoh: "2025-05-12T10:00:00Z" → "12 Mei 2025"
 */
export function formatTanggal(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Label status pembayaran dalam Bahasa Indonesia. */
export function labelStatus(status) {
  switch (status) {
    case 'lunas': return 'Lunas';
    case 'menunggu_konfirmasi': return 'Menunggu Konfirmasi';
    case 'belum': return 'Belum Bayar';
    default: return status || '-';
  }
}

/** CSS class untuk dot status. */
export function classStatus(status) {
  switch (status) {
    case 'lunas': return 'lunas';
    case 'menunggu_konfirmasi': return 'menunggu';
    default: return 'belum';
  }
}

/** Generate opsi tahun untuk dropdown (3 tahun ke belakang, 1 ke depan). */
export function opsiTahun() {
  const sekarang = new Date().getFullYear();
  const hasil = [];
  for (let y = sekarang - 2; y <= sekarang + 1; y++) {
    hasil.push(y);
  }
  return hasil;
}
