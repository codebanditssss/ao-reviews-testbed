import type { Item } from "./cart";

// DEMO / TESTBED CODE — this file exists to give the review flow something
// concrete to comment on. It is not wired into anything and is not intended
// to be used. See PR description.
//
// Every rate here is a whole number of rupees, so nothing in this module
// rounds. That invariant is what makes the plain arithmetic below safe; a
// fractional rate would need src/pricing.ts's paise rounding.

export type Zone = "local" | "metro" | "remote";

const RATES: Record<Zone, number> = {
	local: 40,
	metro: 80,
	remote: 150,
};

/** Units a cart may hold before the per-unit surcharge kicks in. */
const SURCHARGE_FREE_UNITS = 5;

/** Rupees charged per unit beyond SURCHARGE_FREE_UNITS. */
const SURCHARGE_PER_UNIT = 10;

/** Order total, in rupees, above which shipping is free. */
const FREE_SHIPPING_THRESHOLD = 5000;

/** Total number of units in a cart. */
export function itemCount(items: Item[]): number {
	return items.reduce((n, item) => n + item.qty, 0);
}

/**
 * Flat zone rate, plus SURCHARGE_PER_UNIT rupees for every unit beyond the
 * first SURCHARGE_FREE_UNITS.
 *
 * Throws on an unrecognised zone. The Zone union already rules this out within
 * the codebase, but it buys nothing where a zone actually arrives from — a
 * request body, a query param, a database row. Returning undefined there would
 * produce NaN, which formats as '₹NaN' and compares false against every
 * threshold, so the bad value would travel a long way from its cause.
 *
 * The zone is validated before the empty-cart shortcut on purpose: a malformed
 * zone should surface even when the cart happens to be empty, rather than
 * lying dormant until someone adds an item.
 */
export function shippingCost(items: Item[], zone: Zone): number {
	if (!Object.prototype.hasOwnProperty.call(RATES, zone)) {
		throw new RangeError(`Unknown shipping zone: ${JSON.stringify(zone)}`);
	}
	const base = RATES[zone];

	// Nothing to ship, nothing to charge — the flat rate is for moving goods,
	// and an empty cart has none. Without this the base rate is billed anyway.
	if (itemCount(items) === 0) {
		return 0;
	}

	const extra = Math.max(0, itemCount(items) - SURCHARGE_FREE_UNITS) * SURCHARGE_PER_UNIT;
	return base + extra;
}

/** Whether an order ships free — orders over FREE_SHIPPING_THRESHOLD do. */
export function qualifiesForFreeShipping(orderTotal: number): boolean {
	return orderTotal > FREE_SHIPPING_THRESHOLD;
}
