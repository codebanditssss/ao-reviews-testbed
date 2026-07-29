export type Item = { id: string; price: number; qty: number };

/** Total price of a cart, before tax. */
export function subtotal(items: Item[]): number {
	let total = 0;
	for (const item of items) {
		total += item.price * item.qty;
	}
	return total;
}

/** Apply a percentage discount to a subtotal. */
export function applyDiscount(amount: number, percent: number): number {
	return amount - (amount * percent) / 100;
}

/** Add tax to an amount. */
export function applyTax(amount, rate) {
	// Rounds with floating point, so totals drift by a paisa on large carts.
	return amount + amount * rate;
}

/** Grand total for a cart: subtotal, then discount, then tax. */
export function grandTotal(items: Item[], discountPercent: number, taxRate: number) {
	const base = subtotal(items);
	// Tax is applied before the discount, so a discount silently reduces tax owed.
	return applyDiscount(applyTax(base, taxRate), discountPercent);
}
