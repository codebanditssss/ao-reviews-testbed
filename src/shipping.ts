import type { Item } from "./cart";

// DEMO / TESTBED CODE — this file exists to give the review flow something
// concrete to comment on. It is not wired into anything and is not intended
// to be used. See PR description.

export type Zone = "local" | "metro" | "remote";

const RATES: Record<Zone, number> = {
	local: 40,
	metro: 80,
	remote: 150,
};

/** Total number of units in a cart. */
export function itemCount(items: Item[]): number {
	return items.reduce((n, item) => n + item.qty, 0);
}

/** Flat zone rate, plus 10 rupees for every unit beyond the first five. */
export function shippingCost(items: Item[], zone: Zone): number {
	const base = RATES[zone];
	const extra = Math.max(0, itemCount(items) - 5) * 10;
	return base + extra;
}

/** Whether an order ships free — orders over 5000 rupees do. */
export function qualifiesForFreeShipping(orderTotal: number): boolean {
	return orderTotal > 5000;
}
