import { useState, useEffect } from 'react';
import { getRingkasanKasSemua } from '../data/kas.js';
import { getTagihanDenganStatusBulan } from '../data/tagihan.js';
import { formatRupiah, formatBulanTahun, namaBulan, opsiTahun, bulanTahunSekarang, labelStatus } from '../utils.js';

export default function Laporan() {
  const now = bulanTahunSekarang();
  const [bulan, setBulan] = useState(now.bulan);
  const [tahun, setTahun] = useState(now.tahun);
  const [ringkasanSemua, setRingkasanSemua] = useState([]);
  const [detailBulan, setDetailBulan] = useState([]);
  const [loadingRingkasan, setLoadingRingkasan] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    async function loadRingkasan() {
      setLoadingRingkasan(true);
      try {
        const data = await getRingkasanKasSemua();
        setRingkasanSemua(data);
      } catch (err) {
        console.error('Gagal memuat ringkasan kas:', err);
      } finally {
        setLoadingRingkasan(false);
      }
    }
    loadRingkasan();
  }, []);

  useEffect(() => {
    async function loadDetail() {
      setLoadingDetail(true);
      try {
        const data = await getTagihanDenganStatusBulan(bulan, tahun);
        setDetailBulan(data);
      } catch (err) {
        console.error('Gagal memuat detail bulan:', err);
      } finally {
        setLoadingDetail(false);
      }
    }
    loadDetail();
  }, [bulan, tahun]);

  // Data bulan yang sedang ditampilkan
  const kasBulanIni = ringkasanSemua.find(r => r.bulan === bulan && r.tahun === tahun);
  const loading = loadingRingkasan || loadingDetail;

  function handlePrint() {
    window.print();
  }

  return (
    <section className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Laporan Kas</h1>
          <p className="page-subtitle">Ringkasan kas per bulan — bisa dicetak untuk transparansi warga</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handlePrint}
          id="btn-cetak-laporan"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
        >
          <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4.5 7 4.5 2 13.5 2 13.5 7" />
            <path d="M4.5 13H3a1.5 1.5 0 0 1-1.5-1.5V7.5A1.5 1.5 0 0 1 3 6h12a1.5 1.5 0 0 1 1.5 1.5V11.5a1.5 1.5 0 0 1-1.5 1.5h-1.5" />
            <rect x="4.5" y="10" width="9" height="6" rx="1" />
          </svg>
          Cetak Laporan
        </button>
      </div>

      {/* ── Selector bulan ──────────────────────────────── */}
      <div className="toolbar" style={{ marginBottom: 24 }}>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={bulan}
          onChange={e => setBulan(Number(e.target.value))}
          id="select-bulan-laporan"
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
          id="select-tahun-laporan"
        >
          {opsiTahun().map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: '32px 0', color: 'var(--ink-secondary)', fontSize: '0.875rem' }}>
          Memuat data laporan…
        </div>
      ) : (
        <>
          {/* ── Laporan Bulan Terpilih ──────────────────────── */}
          {!kasBulanIni ? (
            <div className="empty-state" style={{ border: '1px solid var(--border-line)', background: 'var(--bg-surface)', marginBottom: 32 }}>
              <h3>Tidak ada data tagihan untuk {formatBulanTahun(bulan, tahun)}</h3>
              <p>Tagihan bulan ini belum pernah di-generate. Buka halaman <strong>Tagihan Bulan Ini</strong> untuk membuat tagihan.</p>
            </div>
          ) : (
            <div style={{ marginBottom: 40 }} id="laporan-cetak">
              {/* Header laporan */}
              <div style={{
                borderBottom: '2px solid var(--ink-primary)',
                paddingBottom: 16,
                marginBottom: 20,
              }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                  Laporan Kas RT — {formatBulanTahun(bulan, tahun)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: 4 }}>
                  Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {/* Ringkasan kas */}
              <div className="laporan-summary stat-row" style={{ marginBottom: 24 }}>
                <div className="stat-block" style={{ flex: 1 }}>
                  <div className="stat-label">Total Terkumpul</div>
                  <div className="laporan-summary-val" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.65rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em', color: 'var(--ink-secondary)', fontWeight: 400 }}>Rp </span>
                    {formatRupiah(kasBulanIni.total_terkumpul)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 4 }}>
                    {kasBulanIni.jumlah_lunas} dari {kasBulanIni.total_tagihan} warga lunas
                  </div>
                </div>
                <div className="stat-block" style={{ flex: 1 }}>
                  <div className="stat-label">Kas RT (15%)</div>
                  <div className="laporan-summary-val" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.65rem', fontWeight: 700 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em', color: 'var(--ink-secondary)', fontWeight: 400 }}>Rp </span>
                    {formatRupiah(kasBulanIni.kas_rt)}
                  </div>
                </div>
                <div className="stat-block" style={{ flex: 1 }}>
                  <div className="stat-label">Setoran RW (85%)</div>
                  <div className="laporan-summary-val" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.65rem', fontWeight: 700 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em', color: 'var(--ink-secondary)', fontWeight: 400 }}>Rp </span>
                    {formatRupiah(kasBulanIni.setor_rw)}
                  </div>
                </div>
              </div>

              {/* Detail per warga */}
              <div className="section-header" style={{ marginBottom: 10 }}>
                <span className="section-title">Rincian Per Warga</span>
              </div>
              <div className="ledger-table-wrapper">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>#</th>
                      <th>Nama</th>
                      <th className="col-blok">No. Blok</th>
                      <th className="col-nominal text-right">Tagihan</th>
                      <th className="col-metode">Metode</th>
                      <th className="col-status">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailBulan.map(({ tagihan, pembayaran, warga }, i) => (
                      <tr key={tagihan.id}>
                        <td style={{ color: 'var(--ink-muted)', width: 44 }}>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{warga?.nama ?? '—'}</td>
                        <td className="col-blok" style={{ color: 'var(--ink-secondary)' }}>{warga?.no_blok ?? '—'}</td>
                        <td className="col-nominal text-right">
                          <span className="amount">Rp {formatRupiah(tagihan.nominal_tagihan)}</span>
                        </td>
                        <td className="col-metode" style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
                          {pembayaran?.metode === 'cash' ? 'Cash' : pembayaran?.metode === 'transfer' ? 'Transfer' : '—'}
                        </td>
                        <td className="col-status">
                          <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: pembayaran?.status === 'lunas' ? 'var(--accent-success)'
                              : pembayaran?.status === 'menunggu_konfirmasi' ? 'var(--accent-warning)'
                                : 'var(--ink-muted)',
                          }}>
                            {labelStatus(pembayaran?.status ?? 'belum')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border-medium)', background: 'var(--bg-sidebar)' }}>
                      <td colSpan={3} style={{ padding: '10px 16px', fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Total Terkumpul
                      </td>
                      <td className="col-nominal text-right" style={{ padding: '10px 16px' }}>
                        <span className="amount" style={{ fontWeight: 700, color: 'var(--accent-success)' }}>
                          Rp {formatRupiah(kasBulanIni.total_terkumpul)}
                        </span>
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Catatan belum lunas */}
              {kasBulanIni.jumlah_belum > 0 && (
                <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                  * {kasBulanIni.jumlah_belum} warga belum melunasi iuran bulan ini, tidak masuk total terkumpul.
                  {kasBulanIni.jumlah_menunggu > 0 && ` ${kasBulanIni.jumlah_menunggu} transfer menunggu konfirmasi.`}
                </div>
              )}
            </div>
          )}

          {/* ── Ringkasan Semua Bulan ──────────────────────── */}
          {ringkasanSemua.length > 0 && (
            <>
              <div className="section-header" style={{ marginTop: 8 }}>
                <span className="section-title">Rekap Semua Bulan</span>
              </div>
              <div className="ledger-table-wrapper">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th className="col-tanggal">Bulan</th>
                      <th className="col-nominal text-right">Total Terkumpul</th>
                      <th className="col-nominal text-right">Kas RT (15%)</th>
                      <th className="col-nominal text-right">Setoran RW (85%)</th>
                      <th className="col-fit text-right">Lunas</th>
                      <th className="col-fit text-right">Belum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ringkasanSemua.map(r => (
                      <tr
                        key={`${r.tahun}-${r.bulan}`}
                        style={r.bulan === bulan && r.tahun === tahun ? { background: 'var(--accent-primary-bg)' } : {}}
                      >
                        <td className="col-tanggal" style={{ fontWeight: r.bulan === bulan && r.tahun === tahun ? 600 : 400 }}>
                          {formatBulanTahun(r.bulan, r.tahun)}
                        </td>
                        <td className="col-nominal text-right">
                          <span className="amount" style={{ color: 'var(--accent-success)' }}>
                            Rp {formatRupiah(r.total_terkumpul)}
                          </span>
                        </td>
                        <td className="col-nominal text-right">
                          <span className="amount">Rp {formatRupiah(r.kas_rt)}</span>
                        </td>
                        <td className="col-nominal text-right">
                          <span className="amount">Rp {formatRupiah(r.setor_rw)}</span>
                        </td>
                        <td className="col-fit text-right" style={{ color: 'var(--accent-success)' }}>{r.jumlah_lunas}</td>
                        <td className="col-fit text-right" style={{ color: r.jumlah_belum > 0 ? 'var(--accent-warning)' : 'var(--ink-muted)' }}>
                          {r.jumlah_belum}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {ringkasanSemua.length === 0 && !kasBulanIni && (
            <div className="empty-state" style={{ border: '1px solid var(--border-line)', background: 'var(--bg-surface)' }}>
              <h3>Belum ada data laporan</h3>
              <p>Laporan akan tersedia setelah tagihan di-generate dan pembayaran dicatat di halaman <strong>Tagihan Bulan Ini</strong>.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
