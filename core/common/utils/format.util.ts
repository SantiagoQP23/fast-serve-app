export function roundTo(num: number, decimalPlaces: number = 0): number {
  if (num < 0) return -roundTo(-num, decimalPlaces); // Handle negative numbers symmetrically

  // Convert to exponential notation, round, and convert back
  num = Math.round(Number(num + "e" + decimalPlaces));
  return Number(num + "e-" + decimalPlaces);
}
