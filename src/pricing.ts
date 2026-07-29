import { applyDiscount, subtotal, type Item } from "./cart";

/**
 * Round a rupee amount to whole paise. This is the ONLY place in the module
 * that rounds, and grandTotal is the only place that calls it on a value.
 *
 * Two distinct hazards live here, and they need different answers:
 *
 * 1. Compounding drift. Each float operation carries a little error, and
 *    rounding after every step bakes that error in and lets it accumulate —
 *    round the subtotal, then the discount, then the tax, and you have three
 *    roundings pulling in the same direction. So the pipeline stays at full
 *    double precision the whole way through and rounds exactly once, at the
 *    end, on the number the customer actually pays. The total therefore
 *    carries a single rounding error of at most half a paisa rather than one
 *    per step. Concretely: a ₹29.97 cart at 10% off and 18% tax settles to
 *    ₹31.83 rounding once, but ₹31.82 if you round after the discount too.
 *
 * 2. Binary representation. `Math.round(x * 100) / 100` on its own gets 1.005
 *    wrong: 1.005 * 100 is 100.49999999999999 in IEEE-754, so it rounds down
 *    to 1.00 when a person plainly meant 1.01. The fix is to widen the scaled
 *    value by a few ULPs before rounding, so a figure sitting a representation
 *    error below the half-paisa boundary lands on the side the decimal reads.
 *
 *    The nudge is RELATIVE (a multiple of the value itself) rather than a fixed
 *    number of significant digits. An earlier version snapped to 12 significant
 *    digits, which quietly truncated real paise on totals past ~1e10 rupees —
 *    12345678901.23 came back as 12345678901.20. A relative nudge scales with
 *    the magnitude, so it corrects representation error at any size without
 *    ever discarding a digit that was actually there.
 *
 *    Four ULPs is the tolerance for drift accumulated across the pipeline. It
 *    is far smaller than any real sub-paise gap — 1.0049999 still rounds down —
 *    so it only ever flips values already inside the noise band.
 *
 * The real fix for money is integer minor units end to end, but cart.ts hands
 * back floats, and reusing it was the requirement. This keeps the float path
 * honest instead.
 */
function roundToPaise(amount: number): number {
	const scaled = amount * 100;
	return Math.round(scaled * (1 + 4 * Number.EPSILON)) / 100;
}

/**
 * Add `rate` percent tax to `amount`.
 *
 * `rate` is a percent, not a fraction, to match applyDiscount's convention in
 * ./cart — 18 means 18%. Deliberately left unrounded: rounding belongs at the
 * end of a calculation, not in the middle of one.
 */
export function applyTax(amount: number, rate: number): number {
	return amount + (amount * rate) / 100;
}

/**
 * The final figure a customer pays, rounded to paise.
 *
 * The discount comes off before tax is charged, so tax is levied on what the
 * customer actually pays rather than on the pre-discount sticker price.
 */
export function grandTotal(items: Item[], discountPercent: number, taxRate: number): number {
	const discounted = applyDiscount(subtotal(items), discountPercent);
	return roundToPaise(applyTax(discounted, taxRate));
}

const rupees = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "INR",
});

/**
 * Render an amount as rupees, e.g. 1234.5 -> '₹1,234.50'.
 *
 * Grouping is every three digits, per the spec's "thousands separators". Note
 * that Indian convention would group as lakh/crore instead (₹10,00,000.00
 * rather than ₹1,000,000.00); switching to the "en-IN" locale is the one-line
 * change if that is wanted.
 *
 * Rounds through roundToPaise so display can never disagree with a settled
 * total — one rounding rule for the whole module. On a value that already came
 * out of grandTotal this is a no-op.
 */
export function formatMoney(amount: number): string {
	const rounded = roundToPaise(amount);
	// Intl renders -0 as '-₹0.00'; nobody is owed negative nothing.
	return rupees.format(rounded === 0 ? 0 : rounded);
}
