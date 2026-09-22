import { useState, useEffect, useRef } from 'react';
import { getWarga, addWarga, updateWarga, deleteWarga } from '../data/warga.js';
import { formatRupiah } from '../utils.js';
import { useAdmin } from '../context/AdminContext.jsx';

const FORM_KOSONG = {
  nama: '',
  no_blok: '',
  luas_tanah: '',
  nominal_iuran: '',
  catatan: '',
};

export default function DataWarga() {
  const { isAdmin } = useAdmin();
  const [list, setList] = useState([]);
  const [modal, setModal] = useState(null);   // null | 'tambah' | 'edit'
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(FORM_KOSONG);
  const [errors, setErrors] = useState({});
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(null); // id warga
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const overlayMouseDownRef = useRef(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getWarga();
      setList(data);
    } catch (err) {
      console.error('Gagal memuat warga:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function bukaModal(mode, warga = null) {
    setErrors({});
    if (mode === 'edit' && warga) {
      setEditTarget(warga.id);
      setForm({
        nama: warga.nama,
        no_blok: warga.no_blok,
        luas_tanah: warga.luas_tanah || '',
        nominal_iuran: String(warga.nominal_iuran),
        catatan: warga.catatan || '',
      });
    } else {
      setEditTarget(null);
      setForm(FORM_KOSONG);
    }
    setModal(mode);
  }

  function tutupModal() {
    setModal(null);
    setEditTarget(null);
    setForm(FORM_KOSONG);
    setErrors({});
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  }

  function validasi() {
    const err = {};
    if (!form.nama.trim()) err.nama = 'Nama warga wajib diisi';
    if (!form.no_blok.trim()) err.no_blok = 'Nomor blok/rumah wajib diisi';
    if (!form.nominal_iuran || isNaN(Number(form.nominal_iuran)) || Number(form.nominal_iuran) <= 0)
      err.nominal_iuran = 'Nominal iuran harus angka positif';
    return err;
  }

  async function handleSimpan(e) {
    e.preventDefault();
    const err = validasi();
    if (Object.keys(err).length > 0) { setErrors(err); return; }

    setSubmitting(true);
    try {
      if (modal === 'tambah') {
        await addWarga(form);
      } else if (modal === 'edit' && editTarget) {
        await updateWarga(editTarget, form);
      }
      await load();
      tutupModal();
    } catch (err) {
      console.error('Gagal menyimpan warga:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleHapus(id) {
    setSubmitting(true);
    try {
      await deleteWarga(id);
      setKonfirmasiHapus(null);
      await load();
    } catch (err) {
      console.error('Gagal menghapus warga:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Data Warga</h1>
          <p className="page-subtitle">{list.length} warga terdaftar</p>
        </div>
        {isAdmin && (
          <button
            id="btn-tambah-warga"
            className="btn btn-primary"
            onClick={() => bukaModal('tambah')}
          >
            + Tambah Warga
          </button>
        )}
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
          <span>Mode Lihat Saja — Login sebagai Admin di sidebar untuk mengelola data warga.</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '32px 0', color: 'var(--ink-secondary)', fontSize: '0.875rem' }}>
          Memuat data warga...
        </div>
      ) : list.length === 0 ? (
        <div className="empty-state" style={{ border: '1px solid var(--border-line)', background: 'var(--bg-surface)' }}>
          <h3>Belum ada data warga</h3>
          <p>Mulai dengan menambahkan warga pertama. Masukkan nama, nomor blok, dan nominal iuran bulanan yang sudah disepakati.</p>
          <button className="btn btn-primary" onClick={() => bukaModal('tambah')}>
            + Tambah Warga Pertama
          </button>
        </div>
      ) : (
        <div className="ledger-table-wrapper">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th className="col-blok">No. Blok</th>
                <th className="col-luas">Luas Tanah</th>
                <th className="col-nominal text-right">Iuran/Bulan</th>
                <th>Catatan</th>
                {isAdmin && <th className="col-aksi"></th>}
              </tr>
            </thead>
            <tbody>
              {list.map(warga => (
                <>
                  <tr key={warga.id}>
                    <td style={{ fontWeight: 500 }}>{warga.nama}</td>
                    <td className="col-blok" style={{ color: 'var(--ink-secondary)' }}>{warga.no_blok}</td>
                    <td className="col-luas" style={{ color: 'var(--ink-muted)' }}>
                      {warga.luas_tanah ? `${warga.luas_tanah} m²` : '—'}
                    </td>
                    <td className="col-nominal text-right">
                      <span className="amount">Rp {formatRupiah(warga.nominal_iuran)}</span>
                    </td>
                    <td style={{ color: 'var(--ink-secondary)', fontSize: '0.82rem', maxWidth: 320 }}>
                      {warga.catatan || <span style={{ color: 'var(--ink-muted)' }}>—</span>}
                    </td>
                    {isAdmin && (
                      <td className="col-aksi">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => bukaModal('edit', warga)}
                          title="Edit data warga"
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--accent-danger)', marginLeft: 4 }}
                          onClick={() => setKonfirmasiHapus(warga.id)}
                          title="Hapus warga"
                        >
                          Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                  {/* Konfirmasi hapus inline */}
                  {isAdmin && konfirmasiHapus === warga.id && (
                    <tr key={warga.id + '-confirm'}>
                      <td colSpan={isAdmin ? 6 : 5} style={{ padding: 0 }}>
                        <div className="confirm-row">
                          <span>Yakin hapus <strong>{warga.nama}</strong>? Data warga akan dihapus permanen.</span>
                          <button className="btn btn-danger btn-sm" onClick={() => handleHapus(warga.id)}>Ya, Hapus</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setKonfirmasiHapus(null)}>Batal</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal Tambah / Edit ─────────────────────────── */}
      {isAdmin && modal && (
        <div
          className="modal-overlay"
          onMouseDown={e => { if (e.target === e.currentTarget) overlayMouseDownRef.current = true; }}
          onClick={e => {
            if (overlayMouseDownRef.current && e.target === e.currentTarget) {
              tutupModal();
            }
            overlayMouseDownRef.current = false;
          }}
        >
          <div className="modal" role="dialog" aria-modal="true" aria-label={modal === 'tambah' ? 'Tambah warga baru' : 'Edit data warga'}>
            <div className="modal-header">
              <h2 className="modal-title">{modal === 'tambah' ? 'Tambah Warga Baru' : 'Edit Data Warga'}</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={tutupModal}
                aria-label="Tutup"
                style={{ padding: '4px 6px', lineHeight: 1 }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="3" y1="3" x2="13" y2="13" />
                  <line x1="13" y1="3" x2="3" y2="13" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSimpan}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="warga-nama">Nama Lengkap *</label>
                  <input
                    id="warga-nama"
                    name="nama"
                    className="form-input"
                    value={form.nama}
                    onChange={handleChange}
                    placeholder="Contoh: Budi Santoso"
                    autoFocus
                  />
                  {errors.nama && <span className="form-error">{errors.nama}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="warga-blok">No. Blok / Rumah *</label>
                  <input
                    id="warga-blok"
                    name="no_blok"
                    className="form-input"
                    value={form.no_blok}
                    onChange={handleChange}
                    placeholder="Contoh: B-12"
                  />
                  {errors.no_blok && <span className="form-error">{errors.no_blok}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="warga-luas">Luas Tanah (m²) <span style={{ color: 'var(--ink-muted)' }}>— opsional, hanya catatan</span></label>
                  <input
                    id="warga-luas"
                    name="luas_tanah"
                    type="number"
                    className="form-input mono"
                    value={form.luas_tanah}
                    onChange={handleChange}
                    placeholder="Contoh: 90"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="warga-nominal">Nominal Iuran / Bulan (Rp) *</label>
                  <input
                    id="warga-nominal"
                    name="nominal_iuran"
                    type="number"
                    className="form-input mono"
                    value={form.nominal_iuran}
                    onChange={handleChange}
                    placeholder="Contoh: 50000"
                    min="0"
                  />
                  {errors.nominal_iuran && <span className="form-error">{errors.nominal_iuran}</span>}
                  <span className="form-hint">Diinput manual sesuai kesepakatan. Perubahan berlaku otomatis di tagihan bulan berikutnya.</span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="warga-catatan">Catatan <span style={{ color: 'var(--ink-muted)' }}>— opsional</span></label>
                  <textarea
                    id="warga-catatan"
                    name="catatan"
                    className="form-textarea"
                    value={form.catatan}
                    onChange={handleChange}
                    placeholder="Contoh: Dapat keringanan 50% — sudah dikonfirmasi ketua RT"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={tutupModal} disabled={submitting}>Batal</button>
                <button type="submit" id="btn-simpan-warga" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : modal === 'tambah' ? 'Tambah Warga' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
