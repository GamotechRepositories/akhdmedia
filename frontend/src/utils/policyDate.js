export function getPolicyLastUpdatedLabel(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `Last Updated: ${day}/${month}/${year}`;
}

export function getPolicyEffectiveDateLabel(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  return `Effective Date: ${day} ${month} ${year}`;
}
