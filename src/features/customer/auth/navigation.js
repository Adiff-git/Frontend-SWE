/**
 * Validates and extracts a safe internal return destination URL.
 * Preserves pathname, search and hash.
 * Rejects external/protocol-relative URLs, backslashes, auth redirect loops, and unavailable Admin routes.
 */
export function getSafeReturnDestination(from, search) {
  let candidate = null;

  if (typeof from === 'object' && from !== null) {
    const pathname = from.pathname || '/';
    const s = from.search || '';
    const h = from.hash || '';
    candidate = `${pathname}${s}${h}`;
  } else if (typeof from === 'string' && from.length > 0) {
    candidate = from;
  } else if (search) {
    const params = typeof search === 'string' ? new URLSearchParams(search) : search;
    candidate = params.get('redirect');
  }

  if (!candidate || typeof candidate !== 'string') {
    return '/';
  }

  // Reject protocol-relative '//', backslashes '\', external schemes '://'
  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    candidate.includes('://')
  ) {
    return '/';
  }

  // Extract pathname part to check against disallowed paths
  let pathname = candidate;
  const qIndex = candidate.indexOf('?');
  const hIndex = candidate.indexOf('#');
  let cutIndex = -1;
  if (qIndex !== -1 && hIndex !== -1) {
    cutIndex = Math.min(qIndex, hIndex);
  } else if (qIndex !== -1) {
    cutIndex = qIndex;
  } else if (hIndex !== -1) {
    cutIndex = hIndex;
  }
  if (cutIndex !== -1) {
    pathname = candidate.slice(0, cutIndex);
  }

  // Avoid auth-route redirect loops
  const authRoutes = ['/login', '/signup', '/signup/verify', '/login/forget', '/login/reset', '/auth/google/callback', '/auth/google/error'];
  if (authRoutes.includes(pathname)) {
    return '/';
  }

  // Exclude unavailable Admin routes until authorization can be verified
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return '/';
  }

  return candidate;
}

