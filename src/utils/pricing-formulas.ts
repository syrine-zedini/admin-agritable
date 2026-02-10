/**
 * Pricing Formula Utilities
 * Centralized calculation logic for B2C and B2B pricing formulas
 *
 * Formula:
 * - B2C: Prix de vente = (Prix Achat ÷ B2C Ratio) × B2C Multiplier
 * - B2B: Prix B2B = (Prix Achat ÷ B2B Ratio) × B2B Multiplier
 *
 * Example:
 * - Purchase: 10.50 TND for 1 Kg
 * - B2C Ratio: 4 (selling in 250g portions)
 * - B2C Multiplier: 2
 * - Result: (10.50 / 4) × 2 = 5.25 TND per 250g portion
 */

export const PricingFormulas = {
  /**
   * Calculate B2C price using formula
   * @param purchasePrice Cost price from supplier (Prix Achat)
   * @param ratio Conversion ratio from purchase unit to B2C selling unit
   * @param multiplier Price multiplier (margin factor)
   * @returns Calculated B2C price rounded to 2 decimal places
   */
  calculateB2CPrice(
    purchasePrice: number,
    ratio: number = 1.0,
    multiplier: number = 2.0
  ): number {
    if (ratio <= 0) {
      console.warn('B2C ratio must be positive, using ratio=1.0');
      ratio = 1.0;
    }
    if (purchasePrice < 0) {
      console.warn('Purchase price cannot be negative');
      return 0;
    }

    const calculatedPrice = (purchasePrice / ratio) * multiplier;
    return Math.round(calculatedPrice * 100) / 100;
  },

  /**
   * Calculate B2B price using formula
   * @param purchasePrice Cost price from supplier (Prix Achat)
   * @param ratio Conversion ratio from purchase unit to B2B selling unit (usually 1.0)
   * @param multiplier Price multiplier (margin factor, usually lower than B2C)
   * @returns Calculated B2B price rounded to 2 decimal places
   */
  calculateB2BPrice(
    purchasePrice: number,
    ratio: number = 1.0,
    multiplier: number = 1.5
  ): number {
    if (ratio <= 0) {
      console.warn('B2B ratio must be positive, using ratio=1.0');
      ratio = 1.0;
    }
    if (purchasePrice < 0) {
      console.warn('Purchase price cannot be negative');
      return 0;
    }

    const calculatedPrice = (purchasePrice / ratio) * multiplier;
    return Math.round(calculatedPrice * 100) / 100;
  },

  /**
   * Check if manual price differs from calculated price (price override indicator)
   * @param manualPrice Manually set price (prix_sur_site)
   * @param calculatedPrice Price from formula calculation
   * @param tolerance Tolerance for floating point comparison (default 0.01)
   * @returns True if manual price overrides calculated price
   */
  hasPriceOverride(
    manualPrice: number | null | undefined,
    calculatedPrice: number,
    tolerance: number = 0.01
  ): boolean {
    if (manualPrice === null || manualPrice === undefined) {
      return false;
    }

    return Math.abs(manualPrice - calculatedPrice) > tolerance;
  },

  /**
   * Calculate margin percentage
   * @param sellingPrice Final selling price
   * @param costPrice Purchase/cost price
   * @returns Margin percentage (rounded to 1 decimal)
   */
  calculateMarginPercent(sellingPrice: number, costPrice: number): number {
    if (costPrice <= 0) {
      return 0;
    }

    const marginPercent = ((sellingPrice - costPrice) / costPrice) * 100;
    return Math.round(marginPercent * 10) / 10;
  },

  /**
   * Calculate multiplier from selling price and cost price
   * Reverse of the pricing formula
   * @param sellingPrice Final selling price
   * @param costPrice Purchase/cost price
   * @param ratio Unit conversion ratio
   * @returns Calculated multiplier (rounded to 2 decimals)
   */
  calculateMultiplierFromPrice(
    sellingPrice: number,
    costPrice: number,
    ratio: number = 1.0
  ): number {
    if (costPrice <= 0 || ratio <= 0) {
      return 2.0; // Default multiplier
    }

    const multiplier = (sellingPrice * ratio) / costPrice;
    return Math.round(multiplier * 100) / 100;
  },

  /**
   * Apply percentage adjustment to a value
   * Used for bulk updates with percentage mode
   * @param value Original value
   * @param percentageChange Percentage to apply (e.g., 10 for +10%, -5 for -5%)
   * @returns New value rounded to 2 decimals
   */
  applyPercentageChange(value: number, percentageChange: number): number {
    const newValue = value * (1 + percentageChange / 100);
    return Math.round(newValue * 100) / 100;
  },

  /**
   * Format price for display in Tunisian Dinar
   * @param price Price value
   * @param includeSymbol Include "د.ت" symbol
   * @returns Formatted price string
   */
  formatPrice(price: number, includeSymbol: boolean = true): string {
    const formatted = price.toFixed(2);
    return includeSymbol ? `${formatted} د.ت` : formatted;
  },

  /**
   * Validate pricing values
   * @param purchasePrice Cost price
   * @param ratio Unit ratio
   * @param multiplier Price multiplier
   * @returns Validation result with errors
   */
  validatePricingInputs(
    purchasePrice: number,
    ratio: number,
    multiplier: number
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (purchasePrice < 0) {
      errors.push('Purchase price cannot be negative');
    }
    if (ratio <= 0) {
      errors.push('Ratio must be positive');
    }
    if (multiplier <= 0) {
      errors.push('Multiplier must be positive');
    }
    if (multiplier < 1) {
      errors.push('Multiplier below 1.0 results in selling below cost (negative margin)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
