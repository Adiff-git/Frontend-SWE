import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  validateProfile,
  buildProfilePayload,
  isProfileDirty,
  countCodePoints,
} from '../src/features/customer/account/profileValidation.js';
import { createMockApiMiddleware, resetMockDb } from '../dev/mockApiPlugin.js';

async function withServer(fn) {
  resetMockDb();
  const middleware = createMockApiMiddleware();
  const server = http.createServer((req, res) => {
    middleware(req, res, () => {
      res.statusCode = 404;
      res.end('PASSED_TO_NEXT');
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function getAuthToken(url, identifier = 'chamtech_user', password = 'password123') {
  const res = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const authHeader = res.headers.get('Authorization');
  return authHeader ? authHeader.replace(/^Bearer\s+/, '') : null;
}

test('buildProfilePayload only includes changed supported fields', () => {
  const baseline = {
    displayName: 'Nguyễn Tuấn Anh',
    phoneNumber: '0988123456',
    email: 'tuananh@example.com',
    gender: 'MALE',
    dateOfBirth: '1995-08-15',
  };

  // No changes
  assert.deepEqual(buildProfilePayload({ ...baseline }, baseline), {});

  // Only phone and email changed
  const payload1 = buildProfilePayload(
    {
      ...baseline,
      phoneNumber: '0901112233',
      email: 'newemail@example.com',
    },
    baseline,
  );
  assert.deepEqual(payload1, {
    phoneNumber: '0901112233',
  });

  // Trimming whitespace
  const payload2 = buildProfilePayload(
    {
      ...baseline,
      displayName: '  Nguyễn Văn B  ',
    },
    baseline,
  );
  assert.deepEqual(payload2, {
    displayName: 'Nguyễn Văn B',
  });
});

test('validateProfile enforces Unicode limits, date, gender and email formats', () => {
  // Empty whitespace name
  const errors1 = validateProfile({ displayName: '   ' });
  assert.ok(errors1.displayName);

  // Name exceeding 100 characters
  const errors2 = validateProfile({ displayName: 'A'.repeat(101) });
  assert.ok(errors2.displayName);

  // Phone exceeding 20 characters
  const errors3 = validateProfile({ phoneNumber: '0'.repeat(21) });
  assert.ok(errors3.phoneNumber);

  // Invalid email
  const errors4 = validateProfile({ username: 'invalid@username' });
  assert.ok(errors4.username);

  // Email exceeding 254 chars
  const errors5 = validateProfile({ username: 'a'.repeat(51) });
  assert.ok(errors5.username);

  // Invalid gender
  const errors6 = validateProfile({ gender: 'UNKNOWN' });
  assert.ok(errors6.gender);

  // Invalid DOB format
  const errors7 = validateProfile({ dateOfBirth: '15/08/1995' });
  assert.ok(errors7.dateOfBirth);

  // Impossible date (e.g. Feb 30)
  const errors8 = validateProfile({ dateOfBirth: '1995-02-30' });
  assert.ok(errors8.dateOfBirth);

  // Future date of birth
  const futureYear = new Date().getFullYear() + 2;
  const errors9 = validateProfile({ dateOfBirth: `${futureYear}-01-01` });
  assert.ok(errors9.dateOfBirth);

  // Valid values
  const errors10 = validateProfile({
    displayName: 'Nguyễn Tuấn Anh',
    phoneNumber: '0988123456',
    email: 'tuananh@example.com',
    gender: 'MALE',
    dateOfBirth: '1995-08-15',
  });
  assert.deepEqual(errors10, {});

  // Supplementary Unicode characters (code points vs UTF-16 units)
  const suppChar = '𠮷'; // 2 UTF-16 code units, 1 Unicode code point
  assert.equal(countCodePoints(suppChar), 1);
  const validSuppName = suppChar.repeat(60); // 60 code points, 120 UTF-16 code units
  assert.equal(validateProfile({ displayName: validSuppName }).displayName, undefined);

  const overflowSuppName = suppChar.repeat(101); // 101 code points
  assert.ok(validateProfile({ displayName: overflowSuppName }).displayName);

  // Clearing existing fields when baseline had values (R2 fix)
  const baselineWithData = {
    displayName: 'Nguyễn Tuấn Anh',
    phoneNumber: '0988123456',
    email: 'tuananh@example.com',
  };
  const clearPhoneErrors = validateProfile({ phoneNumber: '' }, baselineWithData);
  assert.equal(clearPhoneErrors.phoneNumber, 'Hệ thống chưa hỗ trợ xóa số điện thoại đã lưu.');

  const clearEmailErrors = validateProfile({ email: '' }, baselineWithData);
  assert.equal(clearEmailErrors.email, undefined);

  const clearNameErrors = validateProfile({ displayName: '' }, baselineWithData);
  assert.equal(clearNameErrors.displayName, 'Họ và tên không được để trống.');
});

test('isProfileDirty accurately detects changes between draft and baseline', () => {
  const baseline = {
    displayName: 'Nguyễn Tuấn Anh',
    phoneNumber: '0988123456',
    email: 'tuananh@example.com',
    gender: 'MALE',
    dateOfBirth: '1995-08-15',
  };

  // Same values
  assert.equal(isProfileDirty({ ...baseline }, baseline), false);

  // Whitespace-only equivalent
  assert.equal(isProfileDirty({ ...baseline, displayName: '  Nguyễn Tuấn Anh  ' }, baseline), false);

  // Field modified
  assert.equal(isProfileDirty({ ...baseline, displayName: 'Tuấn Anh' }, baseline), true);
  assert.equal(isProfileDirty({ ...baseline, gender: 'FEMALE' }, baseline), true);
  assert.equal(isProfileDirty({ ...baseline, phoneNumber: '' }, baseline), true);
});

test('PUT /api/me updates full profile and returns 200 PrivateUserResponse', async () => {
  await withServer(async (url) => {
    const token = await getAuthToken(url);
    assert.ok(token);

    const updateRes = await fetch(`${url}/api/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        displayName: 'Nguyễn Tuấn Anh Mới',
        phoneNumber: '0988999888',
        gender: 'FEMALE',
        dateOfBirth: '1996-12-25',
        username: 'updated_username',
      }),
    });

    assert.equal(updateRes.status, 200);
    const updated = await updateRes.json();
    assert.equal(updated.displayName, 'Nguyễn Tuấn Anh Mới');
    assert.equal(updated.phoneNumber, '0988999888');
    assert.equal(updated.gender, 'FEMALE');
    assert.equal(updated.dateOfBirth, '1996-12-25');
    assert.equal(updated.username, 'updated_username');
    assert.equal(updated.emailVerified, false);
    assert.equal(updated.hasLocalPassword, true);

    // Confirm with GET /api/me
    const getRes = await fetch(`${url}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const fetched = await getRes.json();
    assert.equal(fetched.displayName, 'Nguyễn Tuấn Anh Mới');
    assert.equal(fetched.gender, 'FEMALE');
  });
});

test('PUT /api/me rejects every supplied email with EMAIL_VERIFICATION_REQUIRED', async () => {
  await withServer(async (url) => {
    // Log in as user 1
    const token = await getAuthToken(url, 'chamtech_user', 'password123');

    // Try to take user 2's email (demo@chamtech.vn)
    const res = await fetch(`${url}/api/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: 'demo@chamtech.vn',
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, 'EMAIL_VERIFICATION_REQUIRED');
  });
});

