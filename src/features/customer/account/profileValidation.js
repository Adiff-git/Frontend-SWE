const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function countCodePoints(str) {
  if (typeof str !== 'string') return 0;
  return [...str].length;
}

export function isProfileDirty(draft, baseline = {}) {
  const clean = (val) => (typeof val === 'string' ? val.trim() : val || '');
  const fields = ['displayName', 'phoneNumber', 'username', 'gender', 'dateOfBirth'];
  return fields.some((field) => clean(draft?.[field]) !== clean(baseline?.[field]));
}

export function validateProfile(values, baseline = {}) {
  const errors = {};
  const clean = (val) => (typeof val === 'string' ? val.trim() : val || '');

  // 1. displayName
  const displayName = values.displayName !== undefined ? values.displayName : baseline.displayName || '';
  const trimmedName = displayName.trim();
  const baseName = clean(baseline.displayName);
  if (trimmedName === '') {
    if (baseName !== '' || displayName !== '') {
      errors.displayName = 'Họ và tên không được để trống.';
    }
  } else if (countCodePoints(trimmedName) > 100) {
    errors.displayName = 'Họ và tên không được vượt quá 100 ký tự.';
  }

  // 2. phoneNumber
  const phone = values.phoneNumber !== undefined ? values.phoneNumber : baseline.phoneNumber || '';
  const trimmedPhone = phone.trim();
  const basePhone = clean(baseline.phoneNumber);
  if (trimmedPhone === '') {
    if (basePhone !== '') {
      errors.phoneNumber = 'Hệ thống chưa hỗ trợ xóa số điện thoại đã lưu.';
    } else if (phone !== '') {
      errors.phoneNumber = 'Số điện thoại không được để khoảng trắng.';
    }
  } else if (countCodePoints(trimmedPhone) > 20) {
    errors.phoneNumber = 'Số điện thoại không được vượt quá 20 ký tự.';
  }

  const username = values.username ?? baseline.username ?? '';
  if (!username.trim() || username.includes('@') || countCodePoints(username.trim()) > 50) {
    if (values.username !== undefined || baseline.username) errors.username = 'Tên đăng nhập không được trống, tối đa 50 ký tự và không chứa @.';
  }

  // 4. gender
  const gender = values.gender !== undefined ? values.gender : baseline.gender || '';
  if (gender && !['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
    errors.gender = 'Giới tính không hợp lệ.';
  }

  // 5. dateOfBirth
  const dob = values.dateOfBirth !== undefined ? values.dateOfBirth : baseline.dateOfBirth || '';
  const baseDob = clean(baseline.dateOfBirth);
  if (!dob && baseDob) {
    errors.dateOfBirth = 'Hệ thống chưa hỗ trợ xóa ngày sinh đã lưu.';
  } else if (dob) {
    if (!DATE_REGEX.test(dob)) {
      errors.dateOfBirth = 'Ngày sinh phải có định dạng YYYY-MM-DD.';
    } else {
      const [year, month, day] = dob.split('-').map(Number);
      const dateObj = new Date(dob + 'T00:00:00Z');
      if (
        dateObj.getUTCFullYear() !== year ||
        dateObj.getUTCMonth() !== month - 1 ||
        dateObj.getUTCDate() !== day
      ) {
        errors.dateOfBirth = 'Ngày sinh không hợp lệ.';
      } else {
        const today = new Date().toISOString().slice(0, 10);
        if (dob > today) {
          errors.dateOfBirth = 'Ngày sinh không được ở tương lai.';
        }
      }
    }
  }

  return errors;
}

/**
 * Builds the changed fields payload comparing draft against server baseline.
 * Only changed fields are included. Trims strings.
 */
export function buildProfilePayload(values, baseline = {}) {
  const payload = {};
  const clean = (val) => (typeof val === 'string' ? val.trim() : val);

  const baseName = clean(baseline.displayName || '');
  const curName = clean(values.displayName || '');
  if (curName !== baseName && curName !== '') {
    payload.displayName = curName;
  }

  const basePhone = clean(baseline.phoneNumber || '');
  const curPhone = clean(values.phoneNumber || '');
  if (curPhone !== basePhone && curPhone !== '') {
    payload.phoneNumber = curPhone;
  }

  const username = clean(values.username ?? baseline.username ?? '');
  if (username && username !== clean(baseline.username || '')) payload.username = username;

  const baseGender = baseline.gender || '';
  const curGender = values.gender || '';
  if (curGender !== baseGender && curGender !== '') {
    payload.gender = curGender;
  }

  const baseDob = baseline.dateOfBirth || '';
  const curDob = values.dateOfBirth || '';
  if (curDob !== baseDob && curDob !== '') {
    payload.dateOfBirth = curDob;
  }

  return payload;
}
