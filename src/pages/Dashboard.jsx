import { useState, useEffect } from 'react';
import { hitungKasBulan } from '../data/kas.js';
import { getTagihanDenganStatusBulan, isTagihanSudahGenerate } from '../data/tagihan.js';
import { formatRupiah, formatBulanTahun, bulanTahunSekarang } from '../utils.js';

export default function Dashboard({ onNavigate }) {
  const { bulan, tahun } = bulanTahunSekarang();
  const [kas, setKas] = useState(null);
  const [detail, setDetail] = useState([]);
  const [sudahGenerate, setSudahGenerate] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [sudah, kasData, detailData] = await Promise.all([
        isTagihanSudahGenerate(bulan, tahun),
        hitungKasBulan(bulan, tahun),
        getTagihanDenganStatusBulan(bulan, tahun),
      ]);
      setSudahGenerate(sudah);
      setKas(kasData);
      setDetail(detailData);
    } catch (err) {
      console.error('Gagal memuat dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Warga yang belum bayar (status 'belum')
  const belumBayar = detail.filter(d => d.pembayaran?.status === 'belum');
  const menungguKonfirmasi = detail.filter(d => d.pembayaran?.status === 'menunggu_konfirmasi');

  return (
    <section className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">{formatBulanTahun(bulan, tahun)} — Ringkasan Bulan Berjalan</p>
      </div>

      {loading ? (
        <div style={{ padding: '32px 0', color: 'var(--ink-secondary)', fontSize: '0.875rem' }}>
          Memuat data dashboard...
        </div>
      ) : (
        <>
          {/* ── Stat Blocks ─────────────────────────────────── */}
          <div className="stat-row">
        {/* Total Terkumpul — elemen paling menonjol */}
        <div className="stat-block">
          <div className="stat-label">Total Terkumpul</div>
          <div className="stat-value primary">
            <span className="currency-prefix">Rp</span>
            {kas ? formatRupiah(kas.total_terkumpul) : '—'}
          </div>
          <div className="stat-note">Cash + transfer terkonfirmasi</div>
        </div>

        {/* Kas RT 15% */}
        <div className="stat-block">
          <div className="stat-label">Kas RT (15%)</div>
          <div className="stat-value">
            <span className="currency-prefix">Rp</span>
            {kas ? formatRupiah(kas.kas_rt) : '—'}
          </div>
          <div className="stat-note">Dikelola RT</div>
        </div>

        {/* Setoran RW 85% */}
        <div className="stat-block">
          <div className="stat-label">Setoran RW (85%)</div>
          <div className="stat-value">
            <span className="currency-prefix">Rp</span>
            {kas ? formatRupiah(kas.setor_rw) : '—'}
          </div>
          <div className="stat-note">Disetorkan ke RW</div>
        </div>
      </div>

      {/* ── Status Pembayaran ─────────────────────────────── */}
      <div className="stat-row" style={{ marginBottom: 32 }}>
        <div className="stat-block" style={{ padding: '22px 32px' }}>
          <div className="stat-label">Sudah Bayar</div>
          <div className="stat-value" style={{ fontSize: '1.85rem', color: 'var(--accent-success)' }}>
            {kas?.jumlah_lunas ?? 0}
            <span style={{ fontSize: '0.88rem', fontFamily: 'var(--font-body)', color: 'var(--ink-muted)', marginLeft: 8, fontWeight: 400 }}>
              / {kas?.total_tagihan ?? 0} warga
            </span>
          </div>
        </div>
        <div className="stat-block" style={{ padding: '22px 32px' }}>
          <div className="stat-label">Menunggu Konfirmasi</div>
          <div className="stat-value" style={{ fontSize: '1.85rem', color: 'var(--accent-warning)' }}>
            {kas?.jumlah_menunggu ?? 0}
            <span style={{ fontSize: '0.88rem', fontFamily: 'var(--font-body)', color: 'var(--ink-muted)', marginLeft: 8, fontWeight: 400 }}>
              transfer
            </span>
          </div>
        </div>
        <div className="stat-block" style={{ padding: '22px 32px' }}>
          <div className="stat-label">Belum Bayar</div>
          <div className="stat-value" style={{ fontSize: '1.85rem', color: 'var(--ink-secondary)' }}>
            {kas?.jumlah_belum ?? 0}
            <span style={{ fontSize: '0.88rem', fontFamily: 'var(--font-body)', color: 'var(--ink-muted)', marginLeft: 8, fontWeight: 400 }}>
              warga
            </span>
          </div>
        </div>
      </div>

      {/* ── Belum bayar list ─────────────────────────────── */}
      {!sudahGenerate ? (
        <div className="empty-state" style={{ border: '1px solid var(--border-line)', background: 'var(--bg-surface)', padding: '40px 24px' }}>
          <h3>Tagihan bulan ini belum di-generate</h3>
          <p>Buka halaman <strong>Tagihan Bulan Ini</strong> untuk membuat tagihan bagi semua warga aktif, lalu catat pembayaran yang masuk.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('tagihan')}>
            Buka Tagihan Bulan Ini →
          </button>
        </div>
      ) : (
        <>
          {menungguKonfirmasi.length > 0 && (
            <div className="alert alert-warn" style={{ marginBottom: 20 }}>
              <strong>{menungguKonfirmasi.length} transfer</strong> menunggu konfirmasi admin. Cek mutasi rekening, lalu konfirmasi di halaman Tagihan.
            </div>
          )}

          <div className="section-header">
            <span className="section-title">Warga Belum Bayar ({belumBayar.length})</span>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('tagihan')}>
              Lihat Semua Tagihan →
            </button>
          </div>

          {belumBayar.length === 0 ? (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-line)', padding: '28px', textAlign: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--accent-success)', fontWeight: 600, fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3.5 9.5 7 13 14.5 5.5" />
                </svg>
                Semua warga sudah bayar bulan ini
              </span>
            </div>
          ) : (
            <div className="ledger-table-wrapper">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Nama Warga</th>
                    <th className="col-blok">No. Blok</th>
                    <th className="col-nominal text-right">Tagihan</th>
                  </tr>
                </thead>
                <tbody>
                  {belumBayar.map(({ tagihan, warga }) => (
                    <tr key={tagihan.id}>
                      <td style={{ fontWeight: 500 }}>{warga?.nama ?? '—'}</td>
                      <td className="col-blok" style={{ color: 'var(--ink-secondary)' }}>{warga?.no_blok ?? '—'}</td>
                      <td className="col-nominal text-right">
                        <span className="amount">Rp {formatRupiah(tagihan.nominal_tagihan)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
        </>
      )}
    </section>
  );
}
