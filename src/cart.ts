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
