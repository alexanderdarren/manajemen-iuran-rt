import { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext(null);

const SESSION_KEY = 'iuran_rt_admin_session';

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    // Restore session dari sessionStorage saat halaman di-refresh
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  function loginAdmin(pin) {
    const correctPin = import.meta.env.VITE_ADMIN_PIN;
    // Jika env var belum diset, tolak semua PIN
    if (!correctPin || correctPin.trim() === '') {
      return false;
    }
    if (String(pin).trim() === String(correctPin).trim()) {
      setIsAdmin(true);
      try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch { }
      return true;
    }
    return false;
  }

  function logoutAdmin() {
    setIsAdmin(false);
    try { sessionStorage.removeItem(SESSION_KEY); } catch { }
  }

  return (
    <AdminContext.Provider value={{ isAdmin, loginAdmin, logoutAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

/** Hook untuk dipakai di komponen manapun */
export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
  return ctx;
}
