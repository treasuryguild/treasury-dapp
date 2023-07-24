let cacheLifetime = 5 * 60 * 1000; // 5 minutes

export function get(key) {
  const item = JSON.parse(localStorage.getItem(key));
  if (!item) return null;

  // Check if cache has expired
  if (Date.now() - item.timestamp >= cacheLifetime) {
    localStorage.removeItem(key);
    return null;
  }

  return item;
}

export function set(key, data, tokens = []) {
  localStorage.setItem(key, JSON.stringify({
    data,
    tokens,
    timestamp: Date.now(),
  }));
}

export function invalidate(key) {
  localStorage.removeItem(key);
}
