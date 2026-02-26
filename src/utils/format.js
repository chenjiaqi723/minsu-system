export function formatMoney(val) {
  if (!val) return "0.00"
  return Number(val).toFixed(2)
}
