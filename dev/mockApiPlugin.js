import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

// Local mock fixtures only - do not reuse in backend configuration or deployed environments.
export const SEED_USERS = [
  {
    id: 1,
    username: 'chamtech_user',
    password: 'password123',
    displayName: 'Nguyễn Tuấn Anh',
    email: 'tuananh@chamtech.vn',
    phoneNumber: '0901234567',
    accountStatus: 'ACTIVE',
    gender: null,
    dateOfBirth: null,
    joinedAt: '2026-01-01T00:00:00Z',
    profileImageId: null,
  },
  {
    id: 2,
    username: 'demo_user',
    password: 'password123',
    displayName: 'Khách hàng Thử nghiệm',
    email: 'demo@chamtech.vn',
    phoneNumber: '0901234567',
    accountStatus: 'ACTIVE',
    gender: null,
    dateOfBirth: null,
    joinedAt: '2026-01-01T00:00:00Z',
    profileImageId: null,
  },
];

export const SEED_ADDRESSES = [
  {
    id: 1,
    userId: 1,
    recipientName: 'Nguyễn Tuấn Anh',
    recipientPhone: '0988123456',
    addressText:
      'Tầng 8, Tòa nhà Bitexco Financial Tower, Số 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    isDefault: true,
  },
  {
    id: 2,
    userId: 1,
    recipientName: 'Nguyễn Tuấn Anh',
    recipientPhone: '0988123456',
    addressText:
      'Căn hộ A12.08, Vinhomes Central Park, 208 Nguyễn Hữu Cảnh, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
    isDefault: false,
  },
  {
    id: 3,
    userId: 1,
    recipientName: 'Nguyễn Tuấn Anh',
    recipientPhone: '0988123456',
    addressText:
      'Số 18, Đường số 6, Khu phố 2, Phường Hiệp Bình Chánh, TP. Thủ Đức, TP. Hồ Chí Minh',
    isDefault: false,
  },
];

let users = [];
let addresses = [];
let nextAddressId = 4;
let sessions = new Map();
let accessTokens = new Map();
let registrations = new Map();
let challenges = new Map();
let proofs = new Map();
// Development-only mailbox fixture; no HTTP endpoint exposes verification codes.
export const MOCK_VERIFICATION_CODE = '000123';
const secret = () => crypto.randomBytes(32).toString('base64url');
const validPassword = (value) => typeof value === 'string' && [...value].length >= 8 && Buffer.byteLength(value, 'utf8') <= 72;
const validEmail = (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && [...value.trim()].length <= 254;
function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body === undefined ? undefined : JSON.stringify(body));
}
function issue(res, userId, status = 200) {
  const result = generateTokens(userId);
  res.setHeader('Authorization', `Bearer ${result.accessToken}`);
  res.setHeader('Access-Control-Expose-Headers', 'Authorization');
  return json(res, status, result.body);
}
function revokeSession(sessionId) {
  for (const session of sessions.values()) if (session.sessionId === sessionId) {
    session.revoked = true;
    const access = accessTokens.get(session.accessToken);
    if (access) access.revoked = true;
  }
}


export function resetMockDb() {
  users = SEED_USERS.map((u) => ({ ...u }));
  addresses = SEED_ADDRESSES.map((a) => ({ ...a }));
  nextAddressId = 4;
  sessions.clear();
  accessTokens.clear();
  registrations.clear();
  challenges.clear();
  proofs.clear();
}

// Initial seed
resetMockDb();

function toPrivateUserResponse(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? null,
    email: user.email,
    phoneNumber: user.phoneNumber,
    accountStatus: user.accountStatus,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    joinedAt: user.joinedAt,
    profileImageId: user.profileImageId,
    profileImageUrl: null,
    emailVerified: user.emailVerified ?? false,
    hasLocalPassword: Boolean(user.password),
  };
}

function toAddressResponse(addr) {
  return {
    id: addr.id,
    recipientName: addr.recipientName,
    recipientPhone: addr.recipientPhone,
    addressText: addr.addressText,
    isDefault: Boolean(addr.isDefault),
  };
}

function generateTokens(userId, expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000, sessionId = crypto.randomUUID()) {
  const accessToken = crypto.randomBytes(32).toString('base64url');
  const refreshToken = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  const accessExpiresIn = 900; // 15 minutes
  const refreshExpiresAt = new Date(expiresAt).toISOString();

  accessTokens.set(accessToken, {
    userId,
    sessionId,
    expiresAt: Math.min(expiresAt, now + accessExpiresIn * 1000),
    revoked: false,
  });

  sessions.set(refreshToken, {
    userId,
    accessToken,
    expiresAt,
    sessionId,
    consumed: false,
    revoked: false,
  });

  return {
    accessToken,
    body: {
      tokenType: 'Bearer',
      accessTokenExpiresIn: accessExpiresIn,
      refreshToken,
      refreshTokenExpiresAt: refreshExpiresAt,
    },
  };
}

function problemJson(res, status, title, detail, instance, fieldErrors = {}, code) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/problem+json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(
    JSON.stringify({
      type: 'about:blank',
      ...(code && { code }),
      title,
      status,
      detail,
      instance,
      timestamp: new Date().toISOString(),
      message: detail,
      path: instance,
      fieldErrors,
    }),
  );
}

function readJsonBody(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    let oversized = false;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        oversized = true;
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (oversized) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        return;
      }
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(JSON.parse(text));
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });

    req.on('error', (err) => reject(err));
  });
}

function authenticate(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  const tokenMeta = accessTokens.get(token);
  if (!tokenMeta || tokenMeta.revoked || Date.now() > tokenMeta.expiresAt) {
    return null;
  }
  const user = users.find((u) => u.id === tokenMeta.userId);
  return user || null;
}

export function createMockApiMiddleware() {
  return async function mockMiddleware(req, res, next) {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;
    const method = req.method ? req.method.toUpperCase() : 'GET';

    // Intercept only in-scope endpoints
    const isAddressRoute =
      pathname === '/api/me/addresses' || /^\/api\/me\/addresses\/\d+$/.test(pathname);
    const identityRoute = /^(\/api\/auth\/registration-verifications\/|\/api\/me\/(email-verification-challenges|reauthentications|google-|password)|\/api\/auth\/(google-|password)|\/api\/image-uploads)/.test(pathname);
    const inScope =
      identityRoute ||
      (pathname === '/api/auth/register' && method === 'POST') ||
      (pathname === '/api/auth/login' && method === 'POST') ||
      (pathname === '/api/auth/refresh' && method === 'POST') ||
      (pathname === '/api/auth/logout' && method === 'POST') ||
      (pathname === '/api/me' && (method === 'GET' || method === 'PUT')) ||
      (isAddressRoute && ['GET', 'POST', 'PUT', 'DELETE'].includes(method));

    if (!inScope) {
      return next();
    }

    try {
      if (pathname === '/api/auth/register' && method === 'POST') {
        const body = await readJsonBody(req);
        if (!body || Object.keys(body).some((key) => !['email', 'password'].includes(key)) || !validEmail(body.email) || !validPassword(body.password)) {
          return problemJson(res, 400, 'Bad Request', 'Invalid registration payload.', pathname);
        }
        const email = body.email.trim().toLowerCase();
        if (users.some((user) => user.email?.toLowerCase() === email)) return problemJson(res, 409, 'Conflict', 'Email already exists.', pathname);
        const pending = { registrationCredential: secret(), challengeId: crypto.randomUUID(), expiresAt: new Date(Date.now() + 600000).toISOString() };
        registrations.set(pending.registrationCredential, { ...pending, email });
        return json(res, 202, pending);
      }
      if (pathname.startsWith('/api/auth/registration-verifications/') && method === 'POST') {
        const body = await readJsonBody(req);
        const pending = registrations.get(body.registrationCredential);
        if (!pending || pending.challengeId !== body.challengeId || Date.parse(pending.expiresAt) <= Date.now()) return problemJson(res, 400, 'Bad Request', 'Expired or superseded registration.', pathname);
        if (pathname.endsWith('/resend')) {
          if (Object.keys(body).some((key) => !['registrationCredential', 'challengeId'].includes(key))) return problemJson(res, 400, 'Bad Request', 'Unknown fields.', pathname);
          registrations.delete(body.registrationCredential);
          const replacement = { registrationCredential: secret(), challengeId: crypto.randomUUID(), expiresAt: new Date(Date.now() + 600000).toISOString() };
          registrations.set(replacement.registrationCredential, { ...replacement, email: pending.email });
          return json(res, 202, replacement);
        }
        if (!pathname.endsWith('/confirm') || Object.keys(body).some((key) => !['registrationCredential', 'challengeId', 'code', 'password'].includes(key)) || body.code !== MOCK_VERIFICATION_CODE || !validPassword(body.password)) return problemJson(res, 400, 'Bad Request', 'Invalid code or password.', pathname);
        if (users.some((user) => user.email?.toLowerCase() === pending.email)) return problemJson(res, 409, 'Conflict', 'Email already exists.', pathname);
        const id = Math.max(0, ...users.map((user) => user.id)) + 1;
        users.push({ id, username: `user_${id}`, email: pending.email, password: body.password, displayName: null, phoneNumber: null, gender: null, dateOfBirth: null, accountStatus: 'ACTIVE', joinedAt: new Date().toISOString(), profileImageId: null, emailVerified: true });
        registrations.delete(body.registrationCredential);
        return issue(res, id, 201);
      }
      if (identityRoute) {
        if (/google-.*attempts|google-code-exchanges|image-uploads/.test(pathname)) return problemJson(res, 503, 'Service Unavailable', 'This local mock does not emulate Google or object storage. Use a configured backend.', pathname);
        const user = authenticate(req);
        if (!user) return problemJson(res, 401, 'Unauthorized', 'Unauthorized', pathname);
        if (pathname === '/api/me/google-connection' && method === 'GET') return json(res, 200, { connected: false, linkedAt: null });
        if (pathname === '/api/me/reauthentications' && method === 'POST') {
          const body = await readJsonBody(req);
          if (!['EMAIL_CHANGE', 'CONNECT_GOOGLE'].includes(body.operation) || body.password !== user.password) return problemJson(res, 401, 'Unauthorized', 'Invalid account proof.', pathname);
          const recentAuthProof = secret();
          const expiresAt = new Date(Date.now() + 300000).toISOString();
          proofs.set(recentAuthProof, { userId: user.id, sessionId: accessTokens.get(req.headers.authorization.slice(7))?.sessionId, operation: body.operation, expiresAt });
          return json(res, 201, { recentAuthProof, expiresAt });
        }
        if (pathname === '/api/me/email-verification-challenges' && method === 'POST') {
          const body = await readJsonBody(req);
          if (!['REGISTRATION', 'EMAIL_CHANGE'].includes(body.purpose) || !validEmail(body.destination)) return problemJson(res, 400, 'Bad Request', 'Invalid email challenge.', pathname);
          const destination = body.destination.trim().toLowerCase();
          if (body.purpose === 'REGISTRATION' && (destination !== user.email || user.emailVerified)) return problemJson(res, 409, 'Conflict', 'Current email is already verified or differs.', pathname);
          if (body.purpose === 'EMAIL_CHANGE' && (destination === user.email || users.some((item) => item.email?.toLowerCase() === destination))) return problemJson(res, 409, 'Conflict', 'Destination unavailable.', pathname);
          for (const [key, old] of challenges) if (old.userId === user.id && old.purpose === body.purpose) challenges.delete(key);
          const result = { id: crypto.randomUUID(), purpose: body.purpose, expiresAt: new Date(Date.now() + 600000).toISOString(), deliveryStatus: 'SENT' };
          challenges.set(result.id, { ...result, userId: user.id, destination });
          return json(res, 201, result);
        }
        const match = pathname.match(/^\/api\/me\/email-verification-challenges\/([^/]+)(\/confirm)?$/);
        if (match) {
          const challenge = challenges.get(match[1]);
          if (!challenge || challenge.userId !== user.id) return problemJson(res, 404, 'Not Found', 'Challenge unavailable.', pathname);
          if (method === 'GET' && !match[2]) {
            const { id, purpose, expiresAt, deliveryStatus } = challenge;
            return json(res, 200, { id, purpose, expiresAt, deliveryStatus: Date.parse(expiresAt) <= Date.now() ? 'EXPIRED' : deliveryStatus });
          }
          if (method === 'POST' && match[2]) {
            const body = await readJsonBody(req);
            if (Date.parse(challenge.expiresAt) <= Date.now() || body.code !== MOCK_VERIFICATION_CODE) return problemJson(res, 400, 'Bad Request', 'Invalid or expired code.', pathname);
            const proof = proofs.get(body.recentAuthProof);
            if (challenge.purpose === 'EMAIL_CHANGE' && (!proof || proof.operation !== 'EMAIL_CHANGE' || proof.userId !== user.id || proof.sessionId !== accessTokens.get(req.headers.authorization.slice(7))?.sessionId || Date.parse(proof.expiresAt) <= Date.now())) return problemJson(res, 401, 'Unauthorized', 'Invalid account proof.', pathname);
            if (users.some((item) => item.id !== user.id && item.email?.toLowerCase() === challenge.destination)) return problemJson(res, 409, 'Conflict', 'Destination unavailable.', pathname);
            user.email = challenge.destination;
            user.emailVerified = true;
            proofs.delete(body.recentAuthProof);
            challenges.delete(challenge.id);
            return json(res, 200, { email: user.email, emailVerified: true });
          }
        }
        if (pathname === '/api/auth/password' && method === 'PUT') {
          const body = await readJsonBody(req);
          if (body.currentPassword !== user.password || !validPassword(body.newPassword) || body.newPassword === user.password) return problemJson(res, 400, 'Bad Request', 'Invalid password change.', pathname);
          user.password = body.newPassword;
          for (const session of sessions.values()) if (session.userId === user.id) revokeSession(session.sessionId);
          return json(res, 204);
        }
        return problemJson(res, 503, 'Service Unavailable', 'Operation requires the identity backend.', pathname);
      }

      // 2. POST /api/auth/login
      if (pathname === '/api/auth/login' && method === 'POST') {
        let body;
        try {
          body = await readJsonBody(req);
        } catch (err) {
          return problemJson(
            res,
            400,
            'Bad Request',
            err.message === 'PAYLOAD_TOO_LARGE' ? 'Payload too large.' : 'Malformed JSON.',
            pathname,
          );
        }

        const { identifier: rawIdentifier, email: rawEmail, password } = body;
        const identifier = rawIdentifier || rawEmail;
        if (typeof identifier !== 'string' || typeof password !== 'string') {
          return problemJson(res, 400, 'Bad Request', 'Invalid login payload.', pathname);
        }

        const trimmedIdentifier = identifier.trim();
        const user = trimmedIdentifier.includes('@')
          ? users.find((u) => u.email.toLowerCase() === trimmedIdentifier.toLowerCase())
          : users.find((u) => u.username.toLowerCase() === trimmedIdentifier.toLowerCase());

        // Password matching: exact without trimming or normalization
        if (!user || user.password !== password) {
          return problemJson(res, 401, 'Unauthorized', 'Invalid credentials.', pathname);
        }

        const tokenData = generateTokens(user.id);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Authorization', `Bearer ${tokenData.accessToken}`);
        res.setHeader('Access-Control-Expose-Headers', 'Authorization');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(tokenData.body));
        return;
      }

      // 3. POST /api/auth/refresh
      if (pathname === '/api/auth/refresh' && method === 'POST') {
        let body;
        try {
          body = await readJsonBody(req);
        } catch (err) {
          return problemJson(
            res,
            400,
            'Bad Request',
            err.message === 'PAYLOAD_TOO_LARGE' ? 'Payload too large.' : 'Malformed JSON.',
            pathname,
          );
        }

        const { refreshToken, ...extra } = body;
        if (Object.keys(extra).length > 0 || typeof refreshToken !== 'string') {
          return problemJson(res, 400, 'Bad Request', 'Invalid refresh payload.', pathname);
        }

        const session = sessions.get(refreshToken);
        if (session?.consumed) revokeSession(session.sessionId);
        if (!session || session.revoked || session.consumed || Date.now() > session.expiresAt) {
          return problemJson(res, 401, 'Unauthorized', 'Invalid or consumed refresh token.', pathname);
        }

        // Single-use token rotation: consume old token
        session.consumed = true;

        const tokenData = generateTokens(session.userId, session.expiresAt, session.sessionId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Authorization', `Bearer ${tokenData.accessToken}`);
        res.setHeader('Access-Control-Expose-Headers', 'Authorization');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(tokenData.body));
        return;
      }

      // 4. POST /api/auth/logout
      if (pathname === '/api/auth/logout' && method === 'POST') {
        let body;
        try {
          body = await readJsonBody(req);
        } catch (err) {
          return problemJson(
            res,
            400,
            'Bad Request',
            err.message === 'PAYLOAD_TOO_LARGE' ? 'Payload too large.' : 'Malformed JSON.',
            pathname,
          );
        }

        const { refreshToken, ...extra } = body;
        if (Object.keys(extra).length > 0 || typeof refreshToken !== 'string') {
          return problemJson(res, 400, 'Bad Request', 'Invalid logout payload.', pathname);
        }

        const session = sessions.get(refreshToken);
        if (!session) {
          return problemJson(res, 401, 'Unauthorized', 'Invalid refresh token.', pathname);
        }

        revokeSession(session.sessionId);

        res.statusCode = 204;
        res.end();
        return;
      }

      // 5. GET /api/me
      if (pathname === '/api/me' && method === 'GET') {
        const user = authenticate(req);
        if (!user) {
          return problemJson(res, 401, 'Unauthorized', 'Unauthorized', pathname);
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(toPrivateUserResponse(user)));
        return;
      }

      // 6. PUT /api/me
      if (pathname === '/api/me' && method === 'PUT') {
        const user = authenticate(req);
        if (!user) {
          return problemJson(res, 401, 'Unauthorized', 'Unauthorized', pathname);
        }

        let body;
        try {
          body = await readJsonBody(req);
        } catch (err) {
          return problemJson(
            res,
            400,
            'Bad Request',
            err.message === 'PAYLOAD_TOO_LARGE' ? 'Payload too large.' : 'Malformed JSON.',
            pathname,
          );
        }

        if (Object.hasOwn(body, 'email')) return problemJson(res, 400, 'Bad Request', 'Email requires verification.', pathname, {}, 'EMAIL_VERIFICATION_REQUIRED');
        const allowedKeys = ['displayName', 'username', 'phoneNumber', 'gender', 'dateOfBirth', 'profileImageId'];
        if (Object.keys(body).some((key) => !allowedKeys.includes(key))) return problemJson(res, 400, 'Bad Request', 'Unknown fields in profile payload.', pathname);
        if (body.username !== undefined) {
          if (typeof body.username !== 'string' || !body.username.trim() || body.username.includes('@') || [...body.username.trim()].length > 50) return problemJson(res, 400, 'Bad Request', 'Invalid username.', pathname);
          if (users.some((item) => item.id !== user.id && item.username.toLowerCase() === body.username.trim().toLowerCase())) return problemJson(res, 409, 'Conflict', 'Username unavailable.', pathname);
        }
        if (body.profileImageId) return problemJson(res, 404, 'Not Found', 'Owned completed image unavailable.', pathname);
        for (const field of ['displayName', 'phoneNumber', 'gender', 'dateOfBirth']) if (body[field] === null) delete body[field];

        const fieldErrors = {};

        // displayName
        if (body.displayName !== undefined) {
          if (typeof body.displayName !== 'string') {
            fieldErrors.displayName = ['Tên hiển thị phải là chuỗi ký tự.'];
          } else {
            const trimmed = body.displayName.trim();
            const codePoints = [...trimmed].length;
            if (codePoints === 0) {
              fieldErrors.displayName = ['Tên hiển thị không được để trống.'];
            } else if (codePoints > 100) {
              fieldErrors.displayName = ['Tên hiển thị không được quá 100 ký tự.'];
            }
          }
        }

        // phoneNumber
        if (body.phoneNumber !== undefined) {
          if (typeof body.phoneNumber !== 'string') {
            fieldErrors.phoneNumber = ['Số điện thoại phải là chuỗi ký tự.'];
          } else {
            const trimmed = body.phoneNumber.trim();
            if (trimmed.length === 0) {
              fieldErrors.phoneNumber = ['Số điện thoại không được để trống.'];
            } else if ([...trimmed].length > 20) {
              fieldErrors.phoneNumber = ['Số điện thoại không được quá 20 ký tự.'];
            }
          }
        }

        // gender
        if (body.gender !== undefined) {
          if (!['MALE', 'FEMALE', 'OTHER'].includes(body.gender)) {
            fieldErrors.gender = ['Giới tính không hợp lệ.'];
          }
        }

        // dateOfBirth
        if (body.dateOfBirth !== undefined) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (typeof body.dateOfBirth !== 'string' || !dateRegex.test(body.dateOfBirth)) {
            fieldErrors.dateOfBirth = ['Ngày sinh phải có định dạng YYYY-MM-DD.'];
          } else {
            const [y, m, d] = body.dateOfBirth.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            if (
              dateObj.getFullYear() !== y ||
              dateObj.getMonth() !== m - 1 ||
              dateObj.getDate() !== d
            ) {
              fieldErrors.dateOfBirth = ['Ngày sinh không hợp lệ.'];
            } else {
              const today = new Date();
              today.setHours(23, 59, 59, 999);
              if (dateObj > today) {
                fieldErrors.dateOfBirth = ['Ngày sinh không được ở tương lai.'];
              }
            }
          }
        }

        if (Object.keys(fieldErrors).length > 0) {
          return problemJson(res, 400, 'Bad Request', 'Validation failed.', pathname, fieldErrors);
        }

        // Apply updates
        if (body.displayName !== undefined) user.displayName = body.displayName.trim();
        if (body.phoneNumber !== undefined) user.phoneNumber = body.phoneNumber.trim();
        if (body.username !== undefined) user.username = body.username.trim();
        if (body.profileImageId === null) user.profileImageId = null;
        if (body.gender !== undefined) user.gender = body.gender;
        if (body.dateOfBirth !== undefined) user.dateOfBirth = body.dateOfBirth;

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(toPrivateUserResponse(user)));
        return;
      }

      // 7. GET /api/me/addresses
      if (pathname === '/api/me/addresses' && method === 'GET') {
        const user = authenticate(req);
        if (!user) {
          return problemJson(res, 401, 'Unauthorized', 'Unauthorized', pathname);
        }

        const userAddresses = addresses
          .filter((a) => a.userId === user.id)
          .sort((a, b) => {
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return b.id - a.id;
          })
          .map(toAddressResponse);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(userAddresses));
        return;
      }

      // 8. GET /api/me/addresses/:id
      const addressIdMatch = pathname.match(/^\/api\/me\/addresses\/(\d+)$/);
      if (addressIdMatch && method === 'GET') {
        const user = authenticate(req);
        if (!user) {
          return problemJson(res, 401, 'Unauthorized', 'Unauthorized', pathname);
        }

        const addrId = Number(addressIdMatch[1]);
        const addr = addresses.find((a) => a.id === addrId && a.userId === user.id);
        if (!addr) {
          return problemJson(res, 404, 'Not Found', 'Address not found.', pathname);
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(toAddressResponse(addr)));
        return;
      }

      // 9. POST /api/me/addresses
      if (pathname === '/api/me/addresses' && method === 'POST') {
        const user = authenticate(req);
        if (!user) {
          return problemJson(res, 401, 'Unauthorized', 'Unauthorized', pathname);
        }

        const userAddrs = addresses.filter((a) => a.userId === user.id);
        if (userAddrs.length >= 20) {
          return problemJson(
            res,
            400,
            'Bad Request',
            'Số lượng địa chỉ tối đa là 20.',
            pathname,
          );
        }

        let body;
        try {
          body = await readJsonBody(req);
        } catch (err) {
          return problemJson(
            res,
            400,
            'Bad Request',
            err.message === 'PAYLOAD_TOO_LARGE' ? 'Payload too large.' : 'Malformed JSON.',
            pathname,
          );
        }

        const fieldErrors = {};
        const { recipientName, recipientPhone, addressText, isDefault } = body || {};

        const cleanName = typeof recipientName === 'string' ? recipientName.trim() : '';
        const cleanPhone = typeof recipientPhone === 'string' ? recipientPhone.trim() : '';
        const cleanAddr = typeof addressText === 'string' ? addressText.trim() : '';

        if (!cleanName) {
          fieldErrors.recipientName = ['Họ và tên người nhận không được để trống.'];
        } else if ([...cleanName].length > 100) {
          fieldErrors.recipientName = ['Họ và tên người nhận không được quá 100 ký tự.'];
        }

        if (!cleanPhone) {
          fieldErrors.recipientPhone = ['Số điện thoại người nhận không được để trống.'];
        } else if (!/^0\d{9}$/.test(cleanPhone)) {
          fieldErrors.recipientPhone = ['Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.'];
        }

        if (!cleanAddr) {
          fieldErrors.addressText = ['Địa chỉ chi tiết không được để trống.'];
        } else if ([...cleanAddr].length > 1000) {
          fieldErrors.addressText = ['Địa chỉ chi tiết không được quá 1000 ký tự.'];
        }

        if (Object.keys(fieldErrors).length > 0) {
          return problemJson(res, 400, 'Bad Request', 'Validation failed.', pathname, fieldErrors);
        }

        // Determine default: first address is always default
        const shouldBeDefault = userAddrs.length === 0 ? true : Boolean(isDefault);
        if (shouldBeDefault) {
          for (const a of addresses) {
            if (a.userId === user.id) a.isDefault = false;
          }
        }

        const newAddr = {
          id: nextAddressId++,
          userId: user.id,
          recipientName: cleanName,
          recipientPhone: cleanPhone,
          addressText: cleanAddr,
          isDefault: shouldBeDefault,
        };
        addresses.push(newAddr);

        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(toAddressResponse(newAddr)));
        return;
      }

      // 10. PUT /api/me/addresses/:id
      if (addressIdMatch && method === 'PUT') {
        const user = authenticate(req);
        if (!user) {
          return problemJson(res, 401, 'Unauthorized', 'Unauthorized', pathname);
        }

        const addrId = Number(addressIdMatch[1]);
        const addr = addresses.find((a) => a.id === addrId && a.userId === user.id);
        if (!addr) {
          return problemJson(res, 404, 'Not Found', 'Address not found.', pathname);
        }

        let body;
        try {
          body = await readJsonBody(req);
        } catch (err) {
          return problemJson(
            res,
            400,
            'Bad Request',
            err.message === 'PAYLOAD_TOO_LARGE' ? 'Payload too large.' : 'Malformed JSON.',
            pathname,
          );
        }

        const fieldErrors = {};
        const { recipientName, recipientPhone, addressText, isDefault } = body || {};

        const cleanName = typeof recipientName === 'string' ? recipientName.trim() : '';
        const cleanPhone = typeof recipientPhone === 'string' ? recipientPhone.trim() : '';
        const cleanAddr = typeof addressText === 'string' ? addressText.trim() : '';

        if (!cleanName) {
          fieldErrors.recipientName = ['Họ và tên người nhận không được để trống.'];
        } else if ([...cleanName].length > 100) {
          fieldErrors.recipientName = ['Họ và tên người nhận không được quá 100 ký tự.'];
        }

        if (!cleanPhone) {
          fieldErrors.recipientPhone = ['Số điện thoại người nhận không được để trống.'];
        } else if (!/^0\d{9}$/.test(cleanPhone)) {
          fieldErrors.recipientPhone = ['Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.'];
        }

        if (!cleanAddr) {
          fieldErrors.addressText = ['Địa chỉ chi tiết không được để trống.'];
        } else if ([...cleanAddr].length > 1000) {
          fieldErrors.addressText = ['Địa chỉ chi tiết không được quá 1000 ký tự.'];
        }

        if (Object.keys(fieldErrors).length > 0) {
          return problemJson(res, 400, 'Bad Request', 'Validation failed.', pathname, fieldErrors);
        }

        if (addr.isDefault && isDefault === false) {
          return problemJson(
            res,
            400,
            'Bad Request',
            'Không thể hủy mặc định của địa chỉ này. Vui lòng đặt một địa chỉ khác làm mặc định.',
            pathname,
          );
        }

        if (isDefault === true) {
          for (const a of addresses) {
            if (a.userId === user.id) a.isDefault = false;
          }
          addr.isDefault = true;
        }

        addr.recipientName = cleanName;
        addr.recipientPhone = cleanPhone;
        addr.addressText = cleanAddr;

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(toAddressResponse(addr)));
        return;
      }

      // 11. DELETE /api/me/addresses/:id
      if (addressIdMatch && method === 'DELETE') {
        const user = authenticate(req);
        if (!user) {
          return problemJson(res, 401, 'Unauthorized', 'Unauthorized', pathname);
        }

        const addrId = Number(addressIdMatch[1]);
        const addrIndex = addresses.findIndex((a) => a.id === addrId && a.userId === user.id);
        if (addrIndex === -1) {
          return problemJson(res, 404, 'Not Found', 'Address not found.', pathname);
        }

        const removed = addresses.splice(addrIndex, 1)[0];

        // If the removed address was default, promote remaining address with highest ID
        if (removed.isDefault) {
          const userRemaining = addresses
            .filter((a) => a.userId === user.id)
            .sort((a, b) => b.id - a.id);
          if (userRemaining.length > 0) {
            userRemaining[0].isDefault = true;
          }
        }

        res.statusCode = 204;
        res.end();
        return;
      }
    } catch (error) {
      if (['INVALID_JSON', 'PAYLOAD_TOO_LARGE'].includes(error.message)) return problemJson(res, 400, 'Bad Request', 'Malformed or oversized JSON.', pathname);
      return problemJson(res, 500, 'Internal Server Error', 'Internal mock server error.', pathname);
    }
  };
}

export function mockApiPlugin() {
  return {
    name: 'vite-plugin-mock-api',
    configureServer(server) {
      server.middlewares.use(createMockApiMiddleware());
    },
  };
}
