import { useState, useEffect, useCallback } from 'react';
import { getRiwayatPembayaran, getDaftarBulanTagihan } from '../data/tagihan.js';
import { getWarga } from '../data/warga.js';
import { formatRupiah, formatBulanTahun, formatTanggal, labelStatus, classStatus, namaBulan, opsiTahun } from '../utils.js';

export default function Riwayat() {
  const [data, setData] = useState([]);
  const [filterWarga, setFilterWarga] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [daftarWarga, setDaftarWarga] = useState([]);
  const [daftarBulanAda, setDaftarBulanAda] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filter = {};
      if (filterWarga) filter.warga_id = filterWarga;
      if (filterBulan) filter.bulan = Number(filterBulan);
      if (filterTahun) filter.tahun = Number(filterTahun);

      const [wargaList, bulanList, riwayatData] = await Promise.all([
        getWarga(),
        getDaftarBulanTagihan(),
        getRiwayatPembayaran(filter),
      ]);

      setDaftarWarga(wargaList);
      setDaftarBulanAda(bulanList);
      setData(riwayatData);
    } catch (err) {
      console.error('Gagal memuat riwayat:', err);
    } finally {
      setLoading(false);
    }
  }, [filterWarga, filterBulan, filterTahun]);

  useEffect(() => { load(); }, [load]);

  function resetFilter() {
    setFilterWarga('');
    setFilterBulan('');
    setFilterTahun('');
  }

  const adaFilter = filterWarga || filterBulan || filterTahun;

  return (
    <section className="page">
      <div className="page-header">
        <h1 className="page-title">Riwayat Pembayaran</h1>
        <p className="page-subtitle">Lihat riwayat per warga atau per bulan</p>
      </div>

      {/* ── Filter ──────────────────────────────────────── */}
      <div className="toolbar" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 160 }}
          value={filterWarga}
          onChange={e => setFilterWarga(e.target.value)}
          id="filter-riwayat-warga"
        >
          <option value="">Semua Warga</option>
          {daftarWarga.map(w => (
            <option key={w.id} value={w.id}>{w.nama} ({w.no_blok})</option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filterBulan}
          onChange={e => setFilterBulan(e.target.value)}
          id="filter-riwayat-bulan"
        >
          <option value="">Semua Bulan</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(b => (
            <option key={b} value={b}>{namaBulan(b)}</option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filterTahun}
          onChange={e => setFilterTahun(e.target.value)}
          id="filter-riwayat-tahun"
        >
          <option value="">Semua Tahun</option>
          {opsiTahun().map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {adaFilter && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={resetFilter}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13" />
              <line x1="13" y1="3" x2="3" y2="13" />
            </svg>
            Reset Filter
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--ink-muted)', alignSelf: 'center' }}>
          {loading ? '…' : `${data.length} data`}
        </span>
      </div>

      {/* ── Tabel Riwayat ──────────────────────────────── */}
      {loading ? (
        <div style={{ padding: '32px 0', color: 'var(--ink-secondary)', fontSize: '0.875rem' }}>
          Memuat riwayat pembayaran…
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state" style={{ border: '1px solid var(--border-line)', background: 'var(--bg-surface)' }}>
          <h3>Tidak ada data riwayat</h3>
          {adaFilter
            ? <p>Tidak ada pembayaran yang cocok dengan filter yang dipilih. Coba ubah atau reset filter.</p>
            : <p>Riwayat pembayaran akan muncul di sini setelah tagihan di-generate dan pembayaran dicatat di halaman <strong>Tagihan Bulan Ini</strong>.</p>
          }
          {adaFilter && (
            <button className="btn btn-secondary" onClick={resetFilter}>Reset Filter</button>
          )}
        </div>
      ) : (
        <div className="ledger-table-wrapper">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Warga</th>
                <th className="col-blok">No. Blok</th>
                <th className="col-tanggal">Bulan</th>
                <th className="col-nominal text-right">Nominal</th>
                <th className="col-metode">Metode</th>
                <th className="col-status">Status</th>
                <th className="col-tanggal">Tgl. Konfirmasi</th>
              </tr>
            </thead>
            <tbody>
              {data.map(({ tagihan, pembayaran, warga }) => (
                <tr key={tagihan.id}>
                  <td style={{ fontWeight: 500 }}>{warga?.nama ?? '—'}</td>
                  <td className="col-blok" style={{ color: 'var(--ink-secondary)' }}>{warga?.no_blok ?? '—'}</td>
                  <td className="col-tanggal" style={{ color: 'var(--ink-secondary)' }}>
                    {formatBulanTahun(tagihan.bulan, tagihan.tahun)}
                  </td>
                  <td className="col-nominal text-right">
                    <span className="amount">Rp {formatRupiah(tagihan.nominal_tagihan)}</span>
                  </td>
                  <td className="col-metode" style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
                    {pembayaran?.metode === 'cash' && 'Cash'}
                    {pembayaran?.metode === 'transfer' && 'Transfer'}
                    {!pembayaran?.metode && '—'}
                  </td>
                  <td className="col-status">
                    <span className={`status-dot ${classStatus(pembayaran?.status ?? 'belum')}`}>
                      {labelStatus(pembayaran?.status ?? 'belum')}
                    </span>
                  </td>
                  <td className="col-tanggal" style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                    {formatTanggal(pembayaran?.tanggal_konfirmasi)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
