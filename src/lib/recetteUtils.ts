/**
 * Recette Utility Functions
 * Handles quantity formatting, calculations, and display helpers for recipes
 */

export type RecetteDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Formats recipe quantity for human-friendly display
 * - Converts kg → g for amounts < 1kg (e.g., 0.250 → "250g")
 * - Converts l → ml for amounts < 1l (e.g., 0.015 → "15ml")
 * - Shows whole numbers for piece-based units
 */
export function formatRecetteQuantity(quantity: number, unit: string): string {
  // Weight units - convert kg to g for small quantities
  if (unit === 'kg' && quantity < 1) {
    const grams = Math.round(quantity * 1000);
    return `${grams}g`;
  }

  // Volume units - convert l to ml for small quantities
  if (unit === 'l' && quantity < 1) {
    const ml = Math.round(quantity * 1000);
    return `${ml}ml`;
  }

  // Piece-based units - show decimals only if needed
  if (unit === 'piece' || unit === 'unit' || unit === 'bunch' || unit === 'Botte') {
    return quantity % 1 === 0
      ? `${quantity}`
      : `${quantity.toFixed(1)}`;
  }

  // Default: show with unit
  return `${quantity} ${unit}`;
}

/**
 * Calculates subtotal for recipe item with decimal precision
 * Always rounds to 2 decimal places for currency
 */
export function calculateRecetteItemSubtotal(quantity: number, unitPrice: number): number {
  return parseFloat((quantity * unitPrice).toFixed(2));
}

/**
 * Gets difficulty badge color for UI display
 */
export function getDifficultyColor(difficulty: RecetteDifficulty): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'hard':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Gets difficulty label in French
 */
export function getDifficultyLabel(difficulty: RecetteDifficulty): string {
  switch (difficulty) {
    case 'easy':
      return 'Facile';
    case 'medium':
      return 'Moyen';
    case 'hard':
      return 'Difficile';
    default:
      return difficulty;
  }
}

/**
 * Formats time display (e.g., "30 min" or "1h 30min")
 */
export function formatTime(minutes: number | null): string {
  if (!minutes || minutes === 0) return '—';

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
}

/**
 * Validates quantity input for recipe items
 * Ensures minimum 0.001 (1g/1ml) precision
 */
export function isValidRecetteQuantity(quantity: number): boolean {
  return !isNaN(quantity) && quantity >= 0.001;
}

/**
 * Parses quantity string and returns number with proper precision
 */
export function parseRecetteQuantity(value: string): number | null {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return null;

  // Round to 3 decimal places to match DECIMAL(10,3)
  return parseFloat(parsed.toFixed(3));
}

/**
 * Calculates total recipe price from items
 */
export function calculateRecetteTotal(items: Array<{ quantity: number; unit_price: number }>): number {
  const total = items.reduce((sum, item) => {
    return sum + calculateRecetteItemSubtotal(item.quantity, item.unit_price);
  }, 0);

  return parseFloat(total.toFixed(2));
}

/**
 * Gets servings display text
 */
export function getServingsText(servings: number): string {
  return `${servings} ${servings === 1 ? 'personne' : 'personnes'}`;
}
