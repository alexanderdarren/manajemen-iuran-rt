/**
 * storage.js
 * Storage layer untuk Firestore (dengan fallback localStorage jika .env belum diisi).
 *
 * Struktur koleksi Firestore:
 * - 'warga'      : tiap dokumen = 1 warga (id dokumen = id warga)
 * - 'tagihan'    : tiap dokumen = 1 tagihan bulanan (id dokumen = id tagihan)
 * - 'pembayaran' : tiap dokumen = 1 pembayaran (id dokumen = id pembayaran)
 */

import { db, isFirebaseConfigured } from '../firebase.js';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

const LOCAL_PREFIX = 'iuran_rt_';

/**
 * Baca semua dokumen dari koleksi Firestore.
 * @param {string} collectionName - 'warga' | 'tagihan' | 'pembayaran'
 * @param {*} defaultValue - nilai default jika kosong / belum ada
 * @returns {Promise<Array>}
 */
export async function getItem(collectionName, defaultValue = []) {
  if (!isFirebaseConfigured() || !db) {
    // Fallback ke localStorage jika kredensial Firebase belum diisi di .env
    try {
      const raw = localStorage.getItem(LOCAL_PREFIX + collectionName);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  }

  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      return defaultValue;
    }

    const items = [];
    snapshot.forEach(docSnap => {
      items.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    return items;
  } catch (error) {
    console.error(`Gagal membaca koleksi "${collectionName}" dari Firestore:`, error);
    return defaultValue;
  }
}

/**
 * Simpan satu dokumen ke Firestore.
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data
 */
export async function saveDoc(collectionName, docId, data) {
  if (!isFirebaseConfigured() || !db) {
    // Fallback ke localStorage
    const list = await getItem(collectionName, []);
    const idx = list.findIndex(item => item.id === docId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
    } else {
      list.push({ id: docId, ...data });
    }
    localStorage.setItem(LOCAL_PREFIX + collectionName, JSON.stringify(list));
    return data;
  }

  try {
    const docRef = doc(db, collectionName, docId);
    // Hapus id dari payload data jika ada, agar id konsisten pada docRef.id
    const payload = { ...data };
    delete payload.id;
    await setDoc(docRef, payload, { merge: true });
    return { id: docId, ...data };
  } catch (error) {
    console.error(`Gagal menyimpan dokumen "${docId}" ke koleksi "${collectionName}":`, error);
    throw error;
  }
}

/**
 * Hapus dokumen dari Firestore berdasarkan ID.
 * @param {string} collectionName
 * @param {string} docId
 */
export async function deleteDocById(collectionName, docId) {
  if (!isFirebaseConfigured() || !db) {
    const list = await getItem(collectionName, []);
    const filtered = list.filter(item => item.id !== docId);
    localStorage.setItem(LOCAL_PREFIX + collectionName, JSON.stringify(filtered));
    return;
  }

  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Gagal menghapus dokumen "${docId}" dari koleksi "${collectionName}":`, error);
    throw error;
  }
}

/**
 * Simpan banyak dokumen sekaligus menggunakan Firestore WriteBatch.
 * Sangat efisien untuk generate tagihan & pembayaran bulanan.
 * @param {string} collectionName
 * @param {Array<object>} items - array dokumen dengan properti .id
 */
export async function saveDocsBatch(collectionName, items) {
  if (!items || items.length === 0) return;

  if (!isFirebaseConfigured() || !db) {
    const current = await getItem(collectionName, []);
    const map = new Map(current.map(it => [it.id, it]));
    for (const item of items) {
      map.set(item.id, item);
    }
    localStorage.setItem(LOCAL_PREFIX + collectionName, JSON.stringify([...map.values()]));
    return;
  }

  try {
    // Firestore batch maksimal 500 operasi per batch
    const CHUNK_SIZE = 450;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, collectionName, item.id);
        const payload = { ...item };
        delete payload.id;
        batch.set(docRef, payload, { merge: true });
      }
      await batch.commit();
    }
  } catch (error) {
    console.error(`Gagal batch write ke koleksi "${collectionName}":`, error);
    throw error;
  }
}

/**
 * Wrapper setItem kompatibel: menyimpan array list ke Firestore.
 * Jika ada dokumen yang dihapus di `list`, dokumen di Firestore juga dihapus.
 * @param {string} collectionName
 * @param {Array<object>} list
 */
export async function setItem(collectionName, list) {
  if (!isFirebaseConfigured() || !db) {
    try {
      localStorage.setItem(LOCAL_PREFIX + collectionName, JSON.stringify(list));
    } catch (e) {
      console.error('Gagal menyimpan ke localStorage:', e);
    }
    return;
  }

  try {
    if (!Array.isArray(list)) {
      return;
    }

    // Ambil dokumen yang ada untuk mendeteksi penghapusan
    const existing = await getItem(collectionName, []);
    const newIds = new Set(list.map(it => it.id));
    const toDelete = existing.filter(it => !newIds.has(it.id));

    // Hapus dokumen yang tidak ada lagi
    for (const item of toDelete) {
      await deleteDocById(collectionName, item.id);
    }

    // Simpan/update dokumen yang baru
    await saveDocsBatch(collectionName, list);
  } catch (error) {
    console.error(`Gagal setItem koleksi "${collectionName}":`, error);
    throw error;
  }
}

/**
 * Hapus seluruh data pada key/koleksi (kompatibel legacy).
 * @param {string} collectionName
 */
export async function removeItem(collectionName) {
  if (!isFirebaseConfigured() || !db) {
    localStorage.removeItem(LOCAL_PREFIX + collectionName);
    return;
  }

  try {
    const existing = await getItem(collectionName, []);
    for (const item of existing) {
      await deleteDocById(collectionName, item.id);
    }
  } catch (error) {
    console.error(`Gagal removeItem koleksi "${collectionName}":`, error);
  }
}
