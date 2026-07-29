import { describe, expect, it } from "vitest";
import { itemCount, qualifiesForFreeShipping, shippingCost } from "./shipping";

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
});
