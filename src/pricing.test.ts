import { describe, expect, it } from "vitest";
import { applyTax, formatMoney, grandTotal } from "./pricing";
import { applyDiscount, subtotal, type Item } from "./cart";

describe("applyTax", () => {
	it("adds the rate as a percentage", () => {
		expect(applyTax(100, 18)).toBe(118);
	});

	it("leaves an amount alone at 0%", () => {
		expect(applyTax(250, 0)).toBe(250);
	});
});

describe("grandTotal", () => {
	it("is zero for an empty cart", () => {
		expect(grandTotal([], 10, 18)).toBe(0);
	});

	it("charges tax on the full subtotal at a 0% discount", () => {
		expect(grandTotal([{ id: "a", price: 100, qty: 2 }], 0, 18)).toBe(236);
	});

	it("is zero at a 100% discount, tax included", () => {
		// Nothing is owed, so there is nothing to tax.
		expect(grandTotal([{ id: "a", price: 999.99, qty: 3 }], 100, 18)).toBe(0);
	});

	it("takes the discount off before charging tax", () => {
		const items: Item[] = [{ id: "a", price: 1000, qty: 1 }];
		// Tax is levied on the discounted figure, not the sticker price.
		expect(grandTotal(items, 10, 18)).toBe(1062);
		expect(grandTotal(items, 10, 18)).toBe(
			Math.round(applyTax(applyDiscount(subtotal(items), 10), 18) * 100) / 100,
		);
	});

	it("rounds once at the end rather than after each step", () => {
		// 29.97 -> 26.973 after 10% off -> 31.82814 with 18% tax -> 31.83.
		// Rounding the discounted figure to 26.97 first would land on 31.82.
		expect(grandTotal([{ id: "a", price: 9.99, qty: 3 }], 10, 18)).toBe(31.83);
	});

	it("absorbs binary float drift", () => {
		// 0.1 * 3 is 0.30000000000000004, and 900 * 1.1 is 990.0000000000001.
		expect(grandTotal([{ id: "a", price: 0.1, qty: 3 }], 0, 0)).toBe(0.3);
		expect(grandTotal([{ id: "a", price: 1000, qty: 1 }], 10, 10)).toBe(990);
	});

	it("rounds a half-paisa up the way the decimal reads", () => {
		// 1.005 * 100 is 100.49999999999999 in IEEE-754; naive scaling gives 1.
		expect(grandTotal([{ id: "a", price: 1.005, qty: 1 }], 0, 0)).toBe(1.01);
		expect(grandTotal([{ id: "a", price: 2.675, qty: 1 }], 0, 0)).toBe(2.68);
	});

	it("leaves a genuinely-below-half figure alone", () => {
		// The ULP nudge must not be wide enough to swallow a real sub-paise gap.
		expect(grandTotal([{ id: "a", price: 1.0049999, qty: 1 }], 0, 0)).toBe(1);
	});

	it("keeps every paise on totals past the 12-significant-digit mark", () => {
		// Regression: snapping the scaled value to 12 significant digits used to
		// truncate real paise here — 12345678901.23 came back as ...901.20.
		expect(grandTotal([{ id: "a", price: 12345678901.23, qty: 1 }], 0, 0)).toBe(12345678901.23);
		expect(grandTotal([{ id: "a", price: 99999999999.99, qty: 1 }], 0, 0)).toBe(99999999999.99);
		expect(grandTotal([{ id: "a", price: 1234567890.12, qty: 1 }], 0, 0)).toBe(1234567890.12);
	});

	it("keeps large totals intact through discount and tax", () => {
		// 20000000000 -> 10% off -> 18000000000 -> 18% tax -> 21240000000.
		expect(grandTotal([{ id: "a", price: 10000000000, qty: 2 }], 10, 18)).toBe(21240000000);
	});
});

describe("formatMoney", () => {
	it("gives two decimals and thousands separators", () => {
		expect(formatMoney(1234.5)).toBe("₹1,234.50");
	});

	it("pads whole and sub-rupee amounts to two decimals", () => {
		expect(formatMoney(0)).toBe("₹0.00");
		expect(formatMoney(0.5)).toBe("₹0.50");
		expect(formatMoney(42)).toBe("₹42.00");
	});

	it("groups every three digits", () => {
		expect(formatMoney(1000000)).toBe("₹1,000,000.00");
	});

	it("does not drop paise on a large amount", () => {
		// Same regression as grandTotal — formatMoney shares roundToPaise.
		expect(formatMoney(12345678901.23)).toBe("₹12,345,678,901.23");
	});

	it("does not render negative zero", () => {
		expect(formatMoney(-0)).toBe("₹0.00");
	});

	it("formats a grand total end to end", () => {
		expect(formatMoney(grandTotal([{ id: "a", price: 9.99, qty: 3 }], 10, 18))).toBe("₹31.83");
	});
});
