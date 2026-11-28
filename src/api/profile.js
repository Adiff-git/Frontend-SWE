import { api, ApiError } from './client.js';

function profileResponse(value) {
  const nullableText = ['displayName', 'phoneNumber', 'gender', 'dateOfBirth', 'email', 'profileImageId', 'profileImageUrl'];
  if (!value || !Number.isSafeInteger(value.id) || typeof value.username !== 'string' ||
      typeof value.emailVerified !== 'boolean' || typeof value.hasLocalPassword !== 'boolean' ||
      typeof value.joinedAt !== 'string' || !['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED'].includes(value.accountStatus) ||
      nullableText.some((key) => value[key] !== null && typeof value[key] !== 'string')) {
    throw new ApiError(502, 'Phản hồi hồ sơ không khớp phiên bản API yêu cầu.', { code: 'CONTRACT_MISMATCH' });
  }
  return value;
}

export const getProfile = async (options) => profileResponse(await api.get('/api/me', undefined, options));

export const updateProfile = async (payload, options) => profileResponse(await api.put('/api/me', payload, options));

