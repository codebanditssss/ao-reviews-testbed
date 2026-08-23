import { describe, expect, it } from "vitest";
import { itemCount, qualifiesForFreeShipping, shippingCost, type Zone } from "./shipping";

describe("shipping (demo)", () => {
	it("counts units across lines", () => {
		expect(itemCount([{ id: "a", price: 10, qty: 2 }, { id: "b", price: 5, qty: 3 }])).toBe(5);
	});

	it("charges the flat zone rate under the threshold", () => {
		expect(shippingCost([{ id: "a", price: 10, qty: 3 }], "metro")).toBe(80);
	});

	it("adds a per-unit surcharge past five units", () => {
		expect(shippingCost([{ id: "a", price: 10, qty: 8 }], "local")).toBe(70);
	});

	it("gives free shipping over the threshold", () => {
		expect(qualifiesForFreeShipping(5000)).toBe(false);
		expect(qualifiesForFreeShipping(5000.01)).toBe(true);
	});

	it("charges nothing for an empty cart", () => {
		// Regression: the surcharge was floored at 0 but the flat base was not,
		// so a zero-item order still paid the zone rate.
		expect(shippingCost([], "metro")).toBe(0);
		expect(shippingCost([], "local")).toBe(0);
		expect(shippingCost([], "remote")).toBe(0);
	});

	it("charges nothing for a cart whose lines are all zero-quantity", () => {
		expect(shippingCost([{ id: "a", price: 10, qty: 0 }], "remote")).toBe(0);
	});

	it("throws on an unknown zone rather than returning NaN", () => {
		// Regression: RATES[zone] was undefined, and undefined + extra is NaN,
		// which formats as '₹NaN' and compares false against every threshold.
		const items = [{ id: "a", price: 10, qty: 1 }];
		expect(() => shippingCost(items, "bogus" as Zone)).toThrow(RangeError);
		expect(() => shippingCost(items, undefined as unknown as Zone)).toThrow(RangeError);
	});

	it("rejects inherited Object property names as unknown zones", () => {
		const items = [{ id: "a", price: 10, qty: 1 }];
		expect(() => shippingCost(items, "toString" as Zone)).toThrow(RangeError);
		expect(() => shippingCost(items, "constructor" as Zone)).toThrow(RangeError);
	});

	it("validates the zone even when the cart is empty", () => {
		// A malformed zone should not lie dormant until someone adds an item.
		expect(() => shippingCost([], "bogus" as Zone)).toThrow(RangeError);
	});
});
