import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { validateAddress } from '../src/features/customer/account/addressValidation.js';
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

test('validateAddress enforces Vietnamese phone regex, required fields and lengths', () => {
  // Empty fields
  const errors1 = validateAddress({});
  assert.ok(errors1.recipientName);
  assert.ok(errors1.recipientPhone);
  assert.ok(errors1.addressText);

  // Invalid phone numbers
  assert.ok(validateAddress({ recipientPhone: '098812345' }).recipientPhone); // 9 digits
  assert.ok(validateAddress({ recipientPhone: '09881234567' }).recipientPhone); // 11 digits
  assert.ok(validateAddress({ recipientPhone: '1988123456' }).recipientPhone); // does not start with 0
  assert.ok(validateAddress({ recipientPhone: '0988abc456' }).recipientPhone); // non-digits

  // Long text limits
  assert.ok(validateAddress({ recipientName: 'N'.repeat(101) }).recipientName);
  assert.ok(validateAddress({ addressText: 'A'.repeat(1001) }).addressText);

  // Valid address
  const errorsValid = validateAddress({
    recipientName: 'Nguyễn Tuấn Anh',
    recipientPhone: '0988123456',
    addressText: 'Số 123 Đường ABC, Phường XYZ, TP. Hồ Chí Minh',
  });
  assert.deepEqual(errorsValid, {});

  // Supplementary Unicode characters (code points vs UTF-16 units)
  const suppChar = '𠮷'; // 2 UTF-16 units, 1 Unicode code point
  const validSuppName = suppChar.repeat(60); // 60 code points, 120 UTF-16 code units
  assert.equal(validateAddress({
    recipientName: validSuppName,
    recipientPhone: '0988123456',
    addressText: 'Địa chỉ hợp lệ',
  }).recipientName, undefined);

  const overflowSuppName = suppChar.repeat(101); // 101 code points
  assert.ok(validateAddress({
    recipientName: overflowSuppName,
    recipientPhone: '0988123456',
    addressText: 'Địa chỉ hợp lệ',
  }).recipientName);

  const validSuppAddr = suppChar.repeat(1000); // 1000 code points, 2000 UTF-16 code units
  assert.equal(validateAddress({
    recipientName: 'Người nhận',
    recipientPhone: '0988123456',
    addressText: validSuppAddr,
  }).addressText, undefined);

  const overflowSuppAddr = suppChar.repeat(1001); // 1001 code points
  assert.ok(validateAddress({
    recipientName: 'Người nhận',
    recipientPhone: '0988123456',
    addressText: overflowSuppAddr,
  }).addressText);
});

test('Address CRUD and default switching workflow via mock API', async () => {
  await withServer(async (url) => {
    const token = await getAuthToken(url);
    assert.ok(token);

    // 1. GET /api/me/addresses returns initial seeded list with default first
    const listRes = await fetch(`${url}/api/me/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(listRes.status, 200);
    const initialList = await listRes.json();
    assert.equal(initialList.length, 3);
    assert.equal(initialList[0].isDefault, true);

    // 2. POST /api/me/addresses creates a new address with isDefault: true
    const createRes = await fetch(`${url}/api/me/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipientName: 'Trần Thị B',
        recipientPhone: '0912345678',
        addressText: 'Số 456 Lê Lợi, Quận 1, TP. Hồ Chí Minh',
        isDefault: true,
      }),
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.equal(created.isDefault, true);
    assert.equal(created.recipientName, 'Trần Thị B');

    // 3. Verify that old default was unset and new address is first
    const listRes2 = await fetch(`${url}/api/me/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const list2 = await listRes2.json();
    assert.equal(list2.length, 4);
    assert.equal(list2[0].id, created.id);
    assert.equal(list2[0].isDefault, true);
    // Address 1 should now not be default
    const addr1 = list2.find((a) => a.id === 1);
    assert.equal(addr1.isDefault, false);

    // 4. PUT /api/me/addresses/:id updates an address and restores it as default
    const updateRes = await fetch(`${url}/api/me/addresses/1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipientName: 'Nguyễn Tuấn Anh Updated',
        recipientPhone: '0988123456',
        addressText: addr1.addressText,
        isDefault: true,
      }),
    });
    assert.equal(updateRes.status, 200);
    const updated = await updateRes.json();
    assert.equal(updated.recipientName, 'Nguyễn Tuấn Anh Updated');
    assert.equal(updated.isDefault, true);

    // 5. DELETE /api/me/addresses/:id deletes non-default address
    const deleteRes = await fetch(`${url}/api/me/addresses/${created.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(deleteRes.status, 204);

    // Verify deletion
    const getDeleted = await fetch(`${url}/api/me/addresses/${created.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(getDeleted.status, 404);

    // 6. Accessing foreign user address returns 404
    const user2Token = await getAuthToken(url, 'demo_user', 'password123');
    const foreignRes = await fetch(`${url}/api/me/addresses/1`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    assert.equal(foreignRes.status, 404);

    // 7. Reject explicitly unsetting current default address (PUT isDefault: false on default address)
    const unsetDefaultRes = await fetch(`${url}/api/me/addresses/1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipientName: 'Nguyễn Tuấn Anh Updated',
        recipientPhone: '0988123456',
        addressText: addr1.addressText,
        isDefault: false,
      }),
    });
    assert.equal(unsetDefaultRes.status, 400);
    const unsetErr = await unsetDefaultRes.json();
    assert.ok(unsetErr.detail.includes('Không thể hủy mặc định'));

    // 8. Enforce 20-address capacity limit
    // Current addresses for user: 3. Create 17 more to reach 20.
    for (let i = 0; i < 17; i++) {
      const res = await fetch(`${url}/api/me/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientName: `Người nhận ${i}`,
          recipientPhone: '0912345678',
          addressText: `Địa chỉ số ${i}`,
          isDefault: false,
        }),
      });
      assert.equal(res.status, 201);
    }

    // The 21st address must return 400
    const overLimitRes = await fetch(`${url}/api/me/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipientName: 'Vượt quá giới hạn',
        recipientPhone: '0912345678',
        addressText: 'Địa chỉ thứ 21',
        isDefault: false,
      }),
    });
    assert.equal(overLimitRes.status, 400);
    const limitErr = await overLimitRes.json();
    assert.ok(limitErr.detail.includes('20'));
  });
});

