import { useSyncExternalStore } from "react";

export type CartItem = { slug: string; size: string; qty: number };

const KEY = "now-cart";
let items: CartItem[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const EMPTY: CartItem[] = [];

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) items = JSON.parse(raw);
  } catch {
    items = [];
  }
}

const emit = () => {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
};

export const cartStore = {
  add(slug: string, size: string, qty = 1) {
    load();
    const found = items.find((i) => i.slug === slug && i.size === size);
    items = found
      ? items.map((i) => (i === found ? { ...i, qty: Math.min(10, i.qty + qty) } : i))
      : [...items, { slug, size, qty }];
    emit();
  },
  setQty(slug: string, size: string, qty: number) {
    load();
    items = items.map((i) => (i.slug === slug && i.size === size ? { ...i, qty: Math.max(1, Math.min(10, qty)) } : i));
    emit();
  },
  remove(slug: string, size: string) {
    load();
    items = items.filter((i) => !(i.slug === slug && i.size === size));
    emit();
  },
  clear() {
    items = [];
    emit();
  },
  get() {
    load();
    return items;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useCart() {
  return useSyncExternalStore(cartStore.subscribe, cartStore.get, () => EMPTY);
}

export function useCartCount() {
  return useCart().reduce((a, i) => a + i.qty, 0);
}
