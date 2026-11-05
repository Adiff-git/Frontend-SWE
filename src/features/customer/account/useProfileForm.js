import { useCallback, useMemo, useRef, useState } from 'react';
import useAuth from '../../../hooks/useAuth';
import { buildProfilePayload, isProfileDirty, validateProfile } from './profileValidation';

export default function useProfileForm() {
  const { user, updateProfile } = useAuth();

  const [baseline, setBaseline] = useState(() => ({
    displayName: user?.displayName || '',
    phoneNumber: user?.phoneNumber || '',
    gender: user?.gender || '',
    dateOfBirth: user?.dateOfBirth || '',
    username: user?.username || '',
  }));

  const [draft, setDraft] = useState(() => ({
    displayName: user?.displayName || '',
    phoneNumber: user?.phoneNumber || '',
    gender: user?.gender || '',
    dateOfBirth: user?.dateOfBirth || '',
    username: user?.username || '',
  }));

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: string }
  const [isPending, setIsPending] = useState(false);
  const isSubmittingRef = useRef(false);

  const [prevUser, setPrevUser] = useState(user);

  const isDirty = useMemo(() => isProfileDirty(draft, baseline), [draft, baseline]);

  // Sync baseline if user identity changed and draft is not dirty
  if (user !== prevUser) {
    setPrevUser(user);
    if (!isDirty && user) {
      const newBaseline = {
        displayName: user.displayName || '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth || '',
        username: user.username || '',
      };
      setBaseline(newBaseline);
      setDraft(newBaseline);
    }
  }

  const handleChange = useCallback((field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setStatusMessage(null);
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleBlur = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      if (isSubmittingRef.current) return;

      const validationErrors = validateProfile(draft, baseline);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setStatusMessage({
          type: 'error',
          text: 'Vui lòng kiểm tra lại các trường thông tin không hợp lệ.',
        });
        return;
      }

      const changedPayload = buildProfilePayload(draft, baseline);
      if (Object.keys(changedPayload).length === 0) {
        return;
      }

      isSubmittingRef.current = true;
      setIsPending(true);
      setStatusMessage(null);
      setErrors({});

      try {
        const updated = await updateProfile(changedPayload);
        const newBaseline = {
          displayName: updated?.displayName || draft.displayName,
          phoneNumber: updated?.phoneNumber || draft.phoneNumber,
          gender: updated?.gender || draft.gender,
          dateOfBirth: updated?.dateOfBirth || draft.dateOfBirth,
          username: updated?.username || draft.username,
        };
        setBaseline(newBaseline);
        setDraft(newBaseline);
        setStatusMessage({
          type: 'success',
          text: 'Lưu thay đổi thông tin cá nhân thành công.',
        });
      } catch (err) {
        const serverErrors = {};
        if (err?.fieldErrors && typeof err.fieldErrors === 'object') {
          Object.assign(serverErrors, err.fieldErrors);
        } else if (err?.errors && typeof err.errors === 'object') {
          Object.assign(serverErrors, err.errors);
        }

        if (err?.status === 409) {
          setStatusMessage({
            type: 'error',
            text: err?.message || 'Thông tin vừa cập nhật bị trùng lặp hoặc xảy ra xung đột.',
          });
        } else if (Object.keys(serverErrors).length > 0) {
          setErrors(serverErrors);
          setStatusMessage({
            type: 'error',
            text: err?.message || 'Một số thông tin chưa hợp lệ theo yêu cầu của hệ thống.',
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: err?.message || 'Đã xảy ra lỗi khi lưu thông tin. Vui lòng thử lại.',
          });
        }
      } finally {
        isSubmittingRef.current = false;
        setIsPending(false);
      }
    },
    [draft, baseline, updateProfile],
  );

  return {
    draft,
    baseline,
    touched,
    errors,
    isDirty,
    isPending,
    statusMessage,
    handleChange,
    handleBlur,
    handleSubmit,
  };
}
