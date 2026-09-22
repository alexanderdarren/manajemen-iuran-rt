import { useState, useEffect, useCallback, useRef } from 'react';
import {
  generateTagihanBulanan,
  getTagihanDenganStatusBulan,
  isTagihanSudahGenerate,
} from '../data/tagihan.js';
import {
  catatPembayaranCash,
  catatPembayaranTransfer,
  konfirmasiTransfer,
  resetPembayaran,
} from '../data/pembayaran.js';
import { getWarga } from '../data/warga.js';
import { formatRupiah, formatBulanTahun, bulanTahunSekarang, labelStatus, classStatus, namaBulan, opsiTahun } from '../utils.js';
import { useAdmin } from '../context/AdminContext.jsx';

export default function TagihanBulanIni() {
  const { isAdmin } = useAdmin();
  const now = bulanTahunSekarang();
  const [bulan, setBulan] = useState(now.bulan);
  const [tahun, setTahun] = useState(now.tahun);
  const [data, setData] = useState([]);
  const [sudahGenerate, setSudahGenerate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(null); // tagihanId | 'generate' | null
  const [modalTransfer, setModalTransfer] = useState(null); // tagihan_id | null
  const [buktiUrl, setBuktiUrl] = useState('');
  const [pesan, setPesan] = useState('');
  const overlayMouseDownRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sudah, detailData] = await Promise.all([
        isTagihanSudahGenerate(bulan, tahun),
        getTagihanDenganStatusBulan(bulan, tahun),
      ]);
      setSudahGenerate(sudah);
      setData(detailData);
    } catch (err) {
      console.error('Gagal memuat tagihan:', err);
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun]);

  useEffect(() => { load(); setPesan(''); }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    setSubmitting('generate');
    try {
      const wargaList = await getWarga();
      const jumlahWarga = wargaList.filter(w => w.aktif).length;
      if (jumlahWarga === 0) {
        setPesan('Belum ada warga aktif. Tambah data warga terlebih dahulu.');
        return;
      }
      const result = await generateTagihanBulanan(bulan, tahun);
      if (result.sudahAda) {
        setPesan('Tagihan bulan ini sudah pernah di-generate.');
      } else {
        setPesan(`Berhasil membuat ${result.tagihan.length} tagihan untuk ${formatBulanTahun(bulan, tahun)}.`);
      }
      await load();
    } catch (err) {
      console.error('Gagal generate tagihan:', err);
      setPesan('Terjadi kesalahan saat generate tagihan. Coba lagi.');
    } finally {
      setGenerating(false);
      setSubmitting(null);
    }
  }

  async function handleCash(tagihanId) {
    setSubmitting(tagihanId);
    try {
      await catatPembayaranCash(tagihanId);
      await load();
    } catch (err) {
      console.error('Gagal catat cash:', err);
    } finally {
      setSubmitting(null);
    }
  }

  function handleBukaTransfer(tagihanId) {
    setBuktiUrl('');
    setModalTransfer(tagihanId);
  }

  async function handleSimpanTransfer(e) {
    e.preventDefault();
    setSubmitting(modalTransfer);
    try {
      await catatPembayaranTransfer(modalTransfer, buktiUrl);
      setModalTransfer(null);
      setBuktiUrl('');
      await load();
    } catch (err) {
      console.error('Gagal catat transfer:', err);
    } finally {
      setSubmitting(null);
    }
  }

  async function handleKonfirmasi(tagihanId) {
    setSubmitting(tagihanId);
    try {
      await konfirmasiTransfer(tagihanId);
      await load();
    } catch (err) {
      console.error('Gagal konfirmasi transfer:', err);
    } finally {
      setSubmitting(null);
    }
  }

  async function handleReset(tagihanId) {
    setSubmitting(tagihanId);
    try {
      await resetPembayaran(tagihanId);
      await load();
    } catch (err) {
      console.error('Gagal reset pembayaran:', err);
    } finally {
      setSubmitting(null);
    }
  }

  // Hitung ringkasan cepat
  const jumlahLunas = data.filter(d => d.pembayaran?.status === 'lunas').length;
  const jumlahMenunggu = data.filter(d => d.pembayaran?.status === 'menunggu_konfirmasi').length;
  const jumlahBelum = data.filter(d => d.pembayaran?.status === 'belum').length;

  return (
    <section className="page">
      <div className="page-header">
        <h1 className="page-title">Tagihan Bulan Ini</h1>
        <p className="page-subtitle">Catat pembayaran warga — cash atau transfer</p>
      </div>

      {/* ── Selector bulan & tahun ──────────────────────── */}
      <div className="toolbar" style={{ marginBottom: 20 }}>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={bulan}
          onChange={e => setBulan(Number(e.target.value))}
          id="select-bulan-tagihan"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(b => (
            <option key={b} value={b}>{namaBulan(b)}</option>
          ))}
        </select>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={tahun}
          onChange={e => setTahun(Number(e.target.value))}
          id="select-tahun-tagihan"
        >
          {opsiTahun().map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <div className="toolbar-right">
          {isAdmin && !sudahGenerate ? (
            <button
              id="btn-generate-tagihan"
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={generating || loading}
            >
              {generating ? 'Membuat…' : `Generate Tagihan ${namaBulan(bulan)} ${tahun}`}
            </button>
          ) : sudahGenerate ? (
            <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
              Tagihan sudah di-generate
            </span>
          ) : null}
        </div>
      </div>

      {/* Banner read-only untuk non-admin */}
      {!isAdmin && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-line)',
          borderRadius: 8,
          padding: '10px 16px',
          marginBottom: 16,
          fontSize: '0.82rem',
          color: 'var(--ink-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0, opacity: 0.6 }}>
            <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" />
            <circle cx="9" cy="9" r="2.5" />
          </svg>
          <span>Mode Lihat Saja — Login sebagai Admin di sidebar untuk mencatat pembayaran.</span>
        </div>
      )}

      {/* Pesan feedback */}
      {pesan && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>{pesan}</div>
      )}

      {/* Status summary */}
      {sudahGenerate && data.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, fontSize: '0.85rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-success)' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 8.5 6.5 12 13 4.5" />
            </svg>
            Lunas: <strong>{jumlahLunas}</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-warning)' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="6.5" />
              <polyline points="8 4.5 8 8 10.5 9.5" />
            </svg>
            Menunggu konfirmasi: <strong>{jumlahMenunggu}</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-muted)' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="8" cy="8" r="5.5" strokeDasharray="3 2" />
            </svg>
            Belum bayar: <strong>{jumlahBelum}</strong>
          </span>
        </div>
      )}

      {/* ── Tabel Tagihan ──────────────────────────────── */}
      {loading ? (
        <div style={{ padding: '32px 0', color: 'var(--ink-secondary)', fontSize: '0.875rem' }}>
          Memuat data tagihan…
        </div>
      ) : !sudahGenerate ? (
        <div className="empty-state" style={{ border: '1px solid var(--border-line)', background: 'var(--bg-surface)' }}>
          <h3>Tagihan {formatBulanTahun(bulan, tahun)} belum dibuat</h3>
          <p>Klik <strong>Generate Tagihan</strong> di atas untuk membuat tagihan bagi semua warga aktif sekaligus. Nominal iuran diambil otomatis dari data tiap warga.</p>
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state" style={{ border: '1px solid var(--border-line)', background: 'var(--bg-surface)' }}>
          <h3>Tidak ada tagihan untuk bulan ini</h3>
          <p>Mungkin belum ada warga aktif saat tagihan di-generate, atau data telah dihapus.</p>
        </div>
      ) : (
        <div className="ledger-table-wrapper">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Nama Warga</th>
                <th className="col-blok">No. Blok</th>
                <th className="col-nominal text-right">Tagihan</th>
                <th className="col-status">Status</th>
                <th className="col-metode">Metode</th>
                <th className="col-aksi">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map(({ tagihan, pembayaran, warga }) => {
                const status = pembayaran?.status ?? 'belum';
                const isBusy = submitting === tagihan.id;
                return (
                  <tr key={tagihan.id}>
                    <td style={{ fontWeight: 500 }}>{warga?.nama ?? '—'}</td>
                    <td className="col-blok" style={{ color: 'var(--ink-secondary)' }}>{warga?.no_blok ?? '—'}</td>
                    <td className="col-nominal text-right">
                      <span className="amount">Rp {formatRupiah(tagihan.nominal_tagihan)}</span>
                    </td>
                    <td className="col-status">
                      <span className={`status-dot ${classStatus(status)}`}>
                        {labelStatus(status)}
                      </span>
                    </td>
                    <td className="col-metode" style={{ color: 'var(--ink-secondary)', fontSize: '0.82rem' }}>
                      {pembayaran?.metode === 'cash' && 'Cash'}
                      {pembayaran?.metode === 'transfer' && 'Transfer'}
                      {!pembayaran?.metode && '—'}
                    </td>
                    <td className="col-aksi">
                      {isAdmin && status === 'belum' && (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleCash(tagihan.id)}
                            disabled={isBusy}
                            title="Tandai lunas — pembayaran cash"
                            id={`btn-cash-${tagihan.id}`}
                          >
                            {isBusy ? '…' : 'Tandai Lunas (Cash)'}
                          </button>
                          <button
                            className="btn btn-warn btn-sm"
                            style={{ marginLeft: 6 }}
                            onClick={() => handleBukaTransfer(tagihan.id)}
                            disabled={isBusy}
                            title="Catat pembayaran transfer"
                            id={`btn-transfer-${tagihan.id}`}
                          >
                            Catat Transfer
                          </button>
                        </>
                      )}
                      {isAdmin && status === 'menunggu_konfirmasi' && (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleKonfirmasi(tagihan.id)}
                            disabled={isBusy}
                            title="Konfirmasi transfer setelah cek mutasi"
                            id={`btn-konfirmasi-${tagihan.id}`}
                          >
                            {isBusy ? '…' : 'Konfirmasi Transfer'}
                          </button>
                          {pembayaran?.bukti_transfer_url && (
                            <span
                              title={`Bukti: ${pembayaran.bukti_transfer_url}`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--ink-muted)', marginLeft: 8, cursor: 'help' }}
                            >
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.2 7.5l-6.7 6.7a4.2 4.2 0 0 1-6-6l6.7-6.7a2.8 2.8 0 0 1 4 4L5.5 12.2a1.4 1.4 0 0 1-2-2L9.8 4" />
                              </svg>
                              bukti
                            </span>
                          )}
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ marginLeft: 4 }}
                            onClick={() => handleReset(tagihan.id)}
                            disabled={isBusy}
                            title="Batalkan / reset ke belum bayar"
                          >
                            Reset
                          </button>
                        </>
                      )}
                      {isAdmin && status === 'lunas' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleReset(tagihan.id)}
                          disabled={isBusy}
                          title="Batalkan pembayaran (reset ke belum bayar)"
                          style={{ color: 'var(--ink-muted)' }}
                        >
                          {isBusy ? '…' : 'Batalkan'}
                        </button>
                      )}
                      {!isAdmin && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal Catat Transfer ─────────────────────────── */}
      {isAdmin && modalTransfer && (
        <div
          className="modal-overlay"
          onMouseDown={e => { if (e.target === e.currentTarget) overlayMouseDownRef.current = true; }}
          onClick={e => {
            if (overlayMouseDownRef.current && e.target === e.currentTarget) {
              setModalTransfer(null);
            }
            overlayMouseDownRef.current = false;
          }}
        >
          <div className="modal" role="dialog" aria-modal="true" aria-label="Catat pembayaran transfer">
            <div className="modal-header">
              <h2 className="modal-title">Catat Pembayaran Transfer</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setModalTransfer(null)}
                aria-label="Tutup modal"
                style={{ padding: '4px 6px', lineHeight: 1 }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="3" y1="3" x2="13" y2="13" />
                  <line x1="13" y1="3" x2="3" y2="13" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSimpanTransfer}>
              <div className="modal-body">
                <div className="alert alert-warn" style={{ marginBottom: 16 }}>
                  Setelah disimpan, status akan menjadi <strong>Menunggu Konfirmasi</strong>. Konfirmasi manual setelah mengecek mutasi rekening.
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="bukti-transfer">Keterangan / Nomor Bukti Transfer</label>
                  <input
                    id="bukti-transfer"
                    className="form-input"
                    value={buktiUrl}
                    onChange={e => setBuktiUrl(e.target.value)}
                    placeholder="Contoh: TRF-20250512-001 atau nama file screenshot"
                    autoFocus
                  />
                  <span className="form-hint">Opsional — bisa dikosongkan. Catat nomor referensi atau nama file bukti untuk memudahkan pencocokan.</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalTransfer(null)}>Batal</button>
                <button
                  type="submit"
                  className="btn btn-warn"
                  id="btn-simpan-transfer"
                  disabled={submitting === modalTransfer}
                >
                  {submitting === modalTransfer ? 'Menyimpan…' : 'Simpan — Menunggu Konfirmasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
