import { useState, useCallback, useRef } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import DataWarga from './pages/DataWarga.jsx';
import TagihanBulanIni from './pages/TagihanBulanIni.jsx';
import Riwayat from './pages/Riwayat.jsx';
import Laporan from './pages/Laporan.jsx';
import { AdminProvider, useAdmin } from './context/AdminContext.jsx';

// Ikon SVG inline kecil — tidak perlu library ikon eksternal
const Icon = {
  Dashboard: () => (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="6" height="6" rx="1" />
      <rect x="10" y="2" width="6" height="6" rx="1" />
      <rect x="2" y="10" width="6" height="6" rx="1" />
      <rect x="10" y="10" width="6" height="6" rx="1" />
    </svg>
  ),
  Warga: () => (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="6" r="3" />
      <path d="M3 16c0-3.314 2.686-6 6-6s6 2.686 6 6" />
    </svg>
  ),
  Tagihan: () => (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2h10a1 1 0 0 1 1 1v13l-2-1.5L11 16l-2-1.5L7 16l-2-1.5L3 16V3a1 1 0 0 1 1-1z" />
      <path d="M6 7h6M6 10h4" />
    </svg>
  ),
  Riwayat: () => (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="7" />
      <path d="M9 5v4l2.5 2.5" />
    </svg>
  ),
  Laporan: () => (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 14V7l6-5 6 5v7H3z" />
      <path d="M7 14v-4h4v4" />
    </svg>
  ),
  Menu: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15">
      <rect x="3" y="8" width="12" height="9" rx="1.5" />
      <path d="M6 8V5.5a3 3 0 0 1 6 0V8" />
    </svg>
  ),
  Unlock: () => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15">
      <rect x="3" y="8" width="12" height="9" rx="1.5" />
      <path d="M6 8V5.5a3 3 0 0 1 6 0" />
    </svg>
  ),
};

const MENU = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Dashboard' },
  { id: 'warga', label: 'Data Warga', icon: 'Warga' },
  { id: 'tagihan', label: 'Tagihan Bulan Ini', icon: 'Tagihan' },
  { id: 'riwayat', label: 'Riwayat', icon: 'Riwayat' },
  { id: 'laporan', label: 'Laporan', icon: 'Laporan' },
];

/* ── Modal PIN ───────────────────────────────────────────── */
function PinModal({ onClose }) {
  const { loginAdmin } = useAdmin();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const overlayMouseDownRef = useRef(false);

  function handleSubmit(e) {
    e.preventDefault();
    const ok = loginAdmin(pin);
    if (ok) {
      onClose();
    } else {
      setError('PIN salah. Coba lagi.');
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={e => { if (e.target === e.currentTarget) overlayMouseDownRef.current = true; }}
      onClick={e => {
        if (overlayMouseDownRef.current && e.target === e.currentTarget) {
          onClose();
        }
        overlayMouseDownRef.current = false;
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Login Admin"
        style={{
          maxWidth: 360,
          animation: shake ? 'shake 0.4s ease' : undefined,
        }}
      >
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon.Lock /> Masuk sebagai Admin
          </h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Tutup"
            style={{ padding: '4px 6px', lineHeight: 1 }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13" />
              <line x1="13" y1="3" x2="3" y2="13" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Masukkan PIN admin untuk mengaktifkan mode pengelolaan data.
            </p>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="admin-pin">PIN Admin</label>
              <input
                id="admin-pin"
                type="password"
                className="form-input mono"
                value={pin}
                onChange={e => { setPin(e.target.value); setError(''); }}
                placeholder="Masukkan PIN"
                autoFocus
                autoComplete="off"
                style={{ letterSpacing: '0.25em', fontSize: '1.2rem' }}
              />
              {error && (
                <span className="form-error" style={{ marginTop: 6, display: 'block' }}>
                  {error}
                </span>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" id="btn-submit-pin">
              Masuk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── App Shell ───────────────────────────────────────────── */
function AppShell() {
  const [halaman, setHalaman] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const { isAdmin, logoutAdmin } = useAdmin();

  const navigateTo = useCallback((id) => {
    setHalaman(id);
    setSidebarOpen(false);
  }, []);

  function renderHalaman() {
    switch (halaman) {
      case 'dashboard': return <Dashboard onNavigate={navigateTo} />;
      case 'warga': return <DataWarga />;
      case 'tagihan': return <TagihanBulanIni />;
      case 'riwayat': return <Riwayat />;
      case 'laporan': return <Laporan />;
      default: return <Dashboard onNavigate={navigateTo} />;
    }
  }

  return (
    <div className="app-shell">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(30,42,38,0.3)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>RT 005 / RW 006</h1>
          <span>PERUMAHAN TAMAN MODERN</span>
        </div>

        <ul className="sidebar-nav" style={{ listStyle: 'none' }}>
          {MENU.map(item => {
            const IconComp = Icon[item.icon];
            return (
              <li key={item.id}>
                <button
                  className={`nav-item ${halaman === item.id ? 'active' : ''}`}
                  onClick={() => navigateTo(item.id)}
                  aria-current={halaman === item.id ? 'page' : undefined}
                >
                  <IconComp />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Admin toggle di footer sidebar */}
        <div className="sidebar-footer">
          {isAdmin ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              padding: '6px 10px',
              borderRadius: 8,
              background: 'rgba(22,121,78,0.10)',
            }}>
              {/* Dot + label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--accent-success)',
                  display: 'inline-block',
                  boxShadow: '0 0 0 2px rgba(22,121,78,0.25)',
                }} />
                <span style={{
                  fontSize: '0.75rem', fontWeight: 600,
                  color: 'var(--accent-success)',
                  letterSpacing: '0.01em',
                }}>
                  Admin
                </span>
              </div>
              {/* Keluar button */}
              <button
                onClick={logoutAdmin}
                id="btn-logout-admin"
                title="Keluar dari mode admin"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.72rem', color: 'var(--ink-secondary)',
                  padding: '2px 6px', borderRadius: 4,
                  lineHeight: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = 'var(--ink-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--ink-secondary)'; }}
              >
                Keluar
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="3" x2="13" y2="13" />
                  <line x1="13" y1="3" x2="3" y2="13" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowPinModal(true)}
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', color: 'var(--ink-muted)', gap: 6 }}
              id="btn-login-admin"
            >
              <Icon.Lock /> &nbsp;Masuk sebagai Admin
            </button>
          )}
        </div>
      </nav>

      {/* Konten Utama */}
      <main className="main-content">
        {renderHalaman()}
      </main>

      {/* Toggle sidebar mobile */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(s => !s)}
        aria-label="Buka menu navigasi"
      >
        <Icon.Menu />
      </button>

      {/* Modal PIN */}
      {showPinModal && <PinModal onClose={() => setShowPinModal(false)} />}
    </div>
  );
}

/* ── Root Export ─────────────────────────────────────────── */
export default function App() {
  return (
    <AdminProvider>
      <AppShell />
    </AdminProvider>
  );
}
