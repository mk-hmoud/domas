/**
 * Nationality codes that are treated as domestic (Turkish) for pricing,
 * bed restrictions, and document language purposes.
 */
const DOMESTIC_NATIONALITY_CODES = new Set(['TR', 'TRNC']);

export function isTurkishNational(nationalityCode: string | null | undefined): boolean {
  return DOMESTIC_NATIONALITY_CODES.has(nationalityCode ?? '');
}
