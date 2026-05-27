// Resolve prescribed values for a block given current adjustments.
// adjustment.key format: "<block-id>.<field>"
// adjustment.raw contains the new value — we try to parse a number out of it.

export function resolvePrescribed(block, phase, adjustments, today = new Date()) {
  const base = { ...(block.prescriptions[phase] || {}) };
  const overrides = [];

  for (const adj of adjustments) {
    if (!adj.key) continue;
    const [blockId, field] = adj.key.split(".");
    if (blockId !== block.id) continue;
    if (!isAdjustmentActive(adj, today)) continue;

    const newValue = extractValue(adj.raw, base[field]);
    if (newValue === undefined) continue;

    base[field] = newValue;
    overrides.push({ field, value: newValue, raw: adj.raw, expire: adj.expire });
  }

  return { values: base, overrides };
}

export function isAdjustmentActive(adj, today = new Date()) {
  if (!adj.expire) return true;
  const isoMatch = adj.expire.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (isoMatch) {
    const expireDate = new Date(isoMatch[1] + "T23:59:59");
    return today <= expireDate;
  }
  // Non-date expire = condition Claude tracks; treat as active until Claude removes it.
  return true;
}

// Extract a numeric or string value from the adjustment's raw text.
// Heuristics:
// 1) If raw starts with a number, use that number.
// 2) If raw is in quotes, return the quoted string.
// 3) Otherwise, return the trimmed text.
function extractValue(raw, fallback) {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  const numMatch = trimmed.match(/^-?\d+(\.\d+)?/);
  if (numMatch) return Number(numMatch[0]);
  const quoted = trimmed.match(/^"([^"]+)"/);
  if (quoted) return quoted[1];
  return trimmed.split(/[.(]/)[0].trim();
}
