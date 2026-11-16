const owned = new Set();
export function previewUrl(file) { const url = URL.createObjectURL(file); owned.add(url); return url; }
export function releaseUrl(url) { if (owned.delete(url)) URL.revokeObjectURL(url); }
export function resetMedia() { owned.forEach(url => URL.revokeObjectURL(url)); owned.clear(); }
