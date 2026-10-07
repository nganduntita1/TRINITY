// Bag state, persisted per-browser in localStorage.
import { getProduct } from './data.js';

const KEY = 'trinity.bag.v1';
const subs = new Set();
let lines = read();

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((l) => getProduct(l.id)) : [];
  } catch {
    return [];
  }
}

function commit() {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage unavailable — keep in memory */ }
  subs.forEach((fn) => fn(cart));
}

const keyOf = (id, size) => `${id}::${size}`;

export const cart = {
  get lines() {
    return lines.map((l) => ({ ...l, key: keyOf(l.id, l.size), product: getProduct(l.id) }));
  },
  count: () => lines.reduce((n, l) => n + l.qty, 0),
  subtotal: () => lines.reduce((n, l) => n + l.qty * getProduct(l.id).price, 0),
  add(id, size, qty = 1) {
    const hit = lines.find((l) => l.id === id && l.size === size);
    if (hit) hit.qty = Math.min(hit.qty + qty, 9);
    else lines.push({ id, size, qty });
    commit();
  },
  setQty(key, qty) {
    const hit = lines.find((l) => keyOf(l.id, l.size) === key);
    if (!hit) return;
    if (qty <= 0) lines = lines.filter((l) => l !== hit);
    else hit.qty = Math.min(qty, 9);
    commit();
  },
  remove(key) {
    lines = lines.filter((l) => keyOf(l.id, l.size) !== key);
    commit();
  },
  clear() {
    lines = [];
    commit();
  },
  subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  }
};
