import { describe, expect, it } from "vitest";
import { applyDiscount, subtotal } from "./cart";

describe("cart", () => {
	it("sums price by quantity", () => {
		expect(subtotal([{ id: "a", price: 250, qty: 2 }])).toBe(500);
	});

	it("takes a percentage off", () => {
		expect(applyDiscount(500, 10)).toBe(450);
	});
});
