/**
 * Garment measurements, as supplied by KALO on 2026-11-12.
 * Measured on the garment itself; allow +/- 0.5 in (about 1 cm).
 */

export type SizeRow = { size: string; chestIn: number; lengthIn: number; chestCm: number; lengthCm: number };

export const sizeTolerance = "Measurements are of the garment and may vary by 0.5 in (about 1 cm).";

/** One chart for all clothing for now (supplied as the oversize T-shirt chart). */
export const sizeChart: SizeRow[] = [
  { size: "XS", chestIn: 40, lengthIn: 25.5, chestCm: 101.6, lengthCm: 64.7 },
  { size: "S", chestIn: 42, lengthIn: 26.5, chestCm: 106.6, lengthCm: 67.3 },
  { size: "M", chestIn: 44, lengthIn: 27.5, chestCm: 111.7, lengthCm: 69.8 },
  { size: "L", chestIn: 46, lengthIn: 28.5, chestCm: 116.8, lengthCm: 72.3 },
  { size: "XL", chestIn: 48, lengthIn: 29.5, chestCm: 121.9, lengthCm: 74.9 },
  { size: "XXL", chestIn: 50, lengthIn: 30.5, chestCm: 127, lengthCm: 77.4 },
];
