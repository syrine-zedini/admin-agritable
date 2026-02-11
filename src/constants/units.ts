/**
 * Unit constants for product unit selection
 * Used in purchase_unit, b2c_selling_unit, and b2b_selling_unit fields
 */

export interface UnitOption {
  value: string;
  label: string;
  category: 'weight' | 'volume' | 'quantity' | 'container';
}

export const UNIT_OPTIONS: UnitOption[] = [
  // Weight units
  { value: 'kg', label: 'Kilogramme (kg)', category: 'weight' },
  { value: 'g', label: 'Gramme (g)', category: 'weight' },
  { value: 't', label: 'Tonne (t)', category: 'weight' },

  // Volume units
  { value: 'L', label: 'Litre (L)', category: 'volume' },
  { value: 'mL', label: 'Millilitre (mL)', category: 'volume' },
  { value: 'cL', label: 'Centilitre (cL)', category: 'volume' },

  // Quantity units
  { value: 'piece', label: 'Pièce', category: 'quantity' },
  { value: 'bunch', label: 'Botte', category: 'quantity' },
  { value: 'dozen', label: 'Douzaine', category: 'quantity' },
  { value: 'unit', label: 'Unité', category: 'quantity' },

  // Container units
  { value: 'box', label: 'Boîte', category: 'container' },
  { value: 'carton', label: 'Carton', category: 'container' },
  { value: 'crate', label: 'Caisse', category: 'container' },
  { value: 'bag', label: 'Sac', category: 'container' },
  { value: 'pallet', label: 'Palette', category: 'container' },
  { value: 'basket', label: 'Panier', category: 'container' },
  { value: 'tray', label: 'Plateau', category: 'container' },
];

/**
 * Group units by category for better UX in dropdowns
 */
export const UNITS_BY_CATEGORY = {
  weight: UNIT_OPTIONS.filter((u) => u.category === 'weight'),
  volume: UNIT_OPTIONS.filter((u) => u.category === 'volume'),
  quantity: UNIT_OPTIONS.filter((u) => u.category === 'quantity'),
  container: UNIT_OPTIONS.filter((u) => u.category === 'container'),
};

/**
 * Category labels in French
 */
export const UNIT_CATEGORY_LABELS: Record<string, string> = {
  weight: 'Poids',
  volume: 'Volume',
  quantity: 'Quantité',
  container: 'Conteneur',
};
type UnitValue = string;
type UnitCategory = 'weight' | 'volume' | 'quantity' | 'container';

const UNIT_CONVERSIONS: Record<UnitCategory, Record<UnitValue, number>> = {
  weight: {
    g: 1,
    kg: 1000,
    t: 1_000_000,
  },

  volume: {
    mL: 1,
    cL: 10,
    L: 1000,
  },

  quantity: {
    unit: 1,
    piece: 1,
    bunch: 1,   // domain-specific → adjustable
    dozen: 12,
  },

  // ❗ Containers are NOT convertible by default
  container: {
    box: 1,
    carton: 1,
    crate: 1,
    bag: 1,
    pallet: 1,
    basket: 1,
    tray: 1,
  },
};

export function getUnitCategory(unit: UnitValue): UnitCategory | null {
  const found = UNIT_OPTIONS.find((u) => u.value === unit);
  return found ? found.category : null;
}
export function canConvert(from: UnitValue, to: UnitValue): boolean {
  const fromCategory = getUnitCategory(from);
  const toCategory = getUnitCategory(to);

  if (!fromCategory || !toCategory) return false;
  if (fromCategory !== toCategory) return false;

  // Containers are not auto-convertible
  if (fromCategory === 'container') return false;

  return true;
}
export function convertUnit(
  value: number,
  from: UnitValue,
  to: UnitValue
): number {
  if (!canConvert(from, to)) {
    throw new Error(`Cannot convert from ${from} to ${to}`);
  }

  const category = getUnitCategory(from)!;
  const fromFactor = UNIT_CONVERSIONS[category][from];
  const toFactor = UNIT_CONVERSIONS[category][to];

  // Convert → base → target
  const valueInBase = value * fromFactor;
  return valueInBase / toFactor;
}
export function getSellingRatio(
  purchaseUnit: UnitValue,
  sellingUnit: UnitValue,
  sellingUnitValue: number
): number {
  if (!canConvert(purchaseUnit, sellingUnit)) {
    throw new Error(`Invalid ratio between ${purchaseUnit} and ${sellingUnit}`);
  }

  // Convert selling quantity into purchase unit
  const sellingInPurchaseUnit = convertUnit(
    sellingUnitValue,
    sellingUnit,
    purchaseUnit
  );

  return sellingInPurchaseUnit;
}
export function calculateB2CStock(product: {
  stock_quantity: number,
  b2c_ratio: number
}): number {
  if (
    product.stock_quantity <= 0 ||
    product.b2c_ratio <= 0
  ) {
    return 0;
  }

  return Math.floor(
    product.stock_quantity / product.b2c_ratio
  );
}