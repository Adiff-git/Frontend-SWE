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

let users = [];
let sessions = new Map();
let accessTokens = new Map();

export function resetMockDb() {
  users = SEED_USERS.map((u) => ({ ...u }));
  sessions.clear();
  accessTokens.clear();
}

// Initial seed
resetMockDb();

function toPrivateUserResponse(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    email: user.email,
    phoneNumber: user.phoneNumber,
    accountStatus: user.accountStatus,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    joinedAt: user.joinedAt,
    profileImageId: user.profileImageId,
  };
}

function generateTokens(userId) {
  const accessToken = crypto.randomBytes(32).toString('hex');
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const accessExpiresIn = 900; // 15 minutes
  const refreshExpiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();

  accessTokens.set(accessToken, {
    userId,
    expiresAt: now + accessExpiresIn * 1000,
    revoked: false,
  });

  sessions.set(refreshToken, {
    userId,
    accessToken,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000,
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

function problemJson(res, status, title, detail, instance, fieldErrors = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/problem+json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(
    JSON.stringify({
      type: 'about:blank',
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
    const inScope =
      (pathname === '/api/auth/register' && method === 'POST') ||
      (pathname === '/api/auth/login' && method === 'POST') ||
      (pathname === '/api/auth/refresh' && method === 'POST') ||
      (pathname === '/api/auth/logout' && method === 'POST') ||
      (pathname === '/api/me' && (method === 'GET' || method === 'PUT'));

    if (!inScope) {
      return next();
    }

    try {
      // 1. POST /api/auth/register
      if (pathname === '/api/auth/register' && method === 'POST') {
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

        const { username, password, ...extra } = body;
        if (Object.keys(extra).length > 0 || typeof username !== 'string' || typeof password !== 'string') {
          return problemJson(res, 400, 'Bad Request', 'Invalid registration payload.', pathname);
        }

        const trimmedUser = username.trim();
        const codePointLength = [...trimmedUser].length;
        if (codePointLength < 4 || codePointLength > 50 || trimmedUser.includes('@')) {
          return problemJson(res, 400, 'Bad Request', 'Invalid username policy.', pathname, {
            username: ['Tên đăng nhập cần 4–50 ký tự và không chứa @.'],
          });
        }

        const passwordBytes = Buffer.byteLength(password, 'utf8');
        const passwordCodePoints = [...password].length;
        if (passwordCodePoints < 8 || passwordBytes > 72) {
          return problemJson(res, 400, 'Bad Request', 'Invalid password policy.', pathname, {
            password: ['Mật khẩu cần tối thiểu 8 ký tự và tối đa 72 byte.'],
          });
        }

        const isDuplicate = users.some((u) => u.username.toLowerCase() === trimmedUser.toLowerCase());
        if (isDuplicate) {
          return problemJson(
            res,
            409,
            'Conflict',
            'Tên đăng nhập đã được sử dụng hoặc yêu cầu đang xung đột.',
            pathname,
          );
        }

        const newUser = {
          id: users.length + 1,
          username: trimmedUser,
          password,
          displayName: '',
          email: `${trimmedUser.toLowerCase()}@example.com`,
          phoneNumber: null,
          accountStatus: 'ACTIVE',
          gender: null,
          dateOfBirth: null,
          joinedAt: new Date().toISOString(),
          profileImageId: null,
        };
        users.push(newUser);

        const tokenData = generateTokens(newUser.id);
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Authorization', `Bearer ${tokenData.accessToken}`);
        res.setHeader('Access-Control-Expose-Headers', 'Authorization');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(tokenData.body));
        return;
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

        const { identifier, password, ...extra } = body;
        if (Object.keys(extra).length > 0 || typeof identifier !== 'string' || typeof password !== 'string') {
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
        if (!session || session.revoked || session.consumed || Date.now() > session.expiresAt) {
          return problemJson(res, 401, 'Unauthorized', 'Invalid or consumed refresh token.', pathname);
        }

        // Single-use token rotation: consume old token
        session.consumed = true;

        const tokenData = generateTokens(session.userId);
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
        if (!session || session.revoked) {
          return problemJson(res, 401, 'Unauthorized', 'Invalid refresh token.', pathname);
        }

        session.revoked = true;
        const linkedAccess = accessTokens.get(session.accessToken);
        if (linkedAccess) {
          linkedAccess.revoked = true;
        }

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

        const { displayName, ...extra } = body;
        if (Object.keys(extra).length > 0 || typeof displayName !== 'string') {
          return problemJson(res, 400, 'Bad Request', 'Invalid profile update payload.', pathname);
        }

        const trimmed = displayName.trim();
        const codePoints = [...trimmed].length;
        if (codePoints === 0) {
          return problemJson(res, 400, 'Bad Request', 'Validation failed.', pathname, {
            displayName: ['Tên hiển thị không được để trống.'],
          });
        }
        if (codePoints > 100) {
          return problemJson(res, 400, 'Bad Request', 'Validation failed.', pathname, {
            displayName: ['Tên hiển thị không được quá 100 ký tự.'],
          });
        }

        user.displayName = trimmed;

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(toPrivateUserResponse(user)));
        return;
      }
    } catch {
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
