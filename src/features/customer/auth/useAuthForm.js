import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import useAuth from '../../../hooks/useAuth';
import { resendRegistration } from '../../../api/auth';
import { authErrorMessage, validateAuth } from './authValidation';
import { beginGoogle } from './googleFlow';

export default function useAuthForm(signup, destination = '/') {
  const auth = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: '', password: '', confirmPassword: '', displayName: '', remember: false, code: '' });
  const [pendingRegistration, setPendingRegistration] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [completionError, setCompletionError] = useState(null);
  const lock = useRef(false);
  const { setCompletingAuth } = auth;
  useEffect(() => () => setCompletingAuth(false), [setCompletingAuth]);

  function finish() {
    auth.setCompletingAuth(false);
    navigate(destination, { replace: true });
  }

  const mutation = useMutation({
    gcTime: 0, retry: false,
    mutationFn: async (action) => {
      setError(null);
      if (action === 'google') {
        await beginGoogle({ destination, remember: values.remember });
        return;
      }
      if (action === 'resend') {
        try { setPendingRegistration(await resendRegistration(pendingRegistration)); }
        catch (failure) {
          if (failure.status === 0 || failure.status >= 500) setPendingRegistration(null);
          throw failure;
        }
        return;
      }
      if (signup && !pendingRegistration && !authenticated) {
        setPendingRegistration(await auth.register(values.email.trim(), values.password));
        return;
      }
      if (!authenticated) {
        auth.setCompletingAuth(true);
        const result = signup
          ? await auth.confirmSignup(pendingRegistration, values.code, values.password, { remember: values.remember })
          : await auth.login(values.email.trim(), values.password, { remember: values.remember });
        setAuthenticated(true);
        setPendingRegistration(null);
        if (result.profileError) {
          setCompletionError('Đã đăng nhập nhưng chưa tải được hồ sơ. Bạn có thể thử tải lại ở trang tiếp theo.');
          return;
        }
      }
      if (signup && values.displayName.trim()) {
        try { await auth.updateProfile(values.displayName.trim()); }
        catch {
          setCompletionError('Tài khoản đã tạo thành công nhưng chưa lưu được tên hiển thị. Bạn có thể thử lại hoặc cập nhật sau trong hồ sơ.');
          return;
        }
      }
      finish();
    },
    onError: (failure) => {
      auth.setCompletingAuth(false);
      setErrors(Object.fromEntries(Object.entries(failure.fieldErrors || {}).map(([key, message]) => [key === 'identifier' ? 'email' : key, Array.isArray(message) ? message[0] : message])));
      setError(failure.code === 'CONTRACT_MISMATCH' ? 'Máy chủ chưa hỗ trợ phiên bản đăng ký yêu cầu.' : authErrorMessage(failure, signup));
      if (pendingRegistration && (failure.status === 0 || failure.status >= 500)) {
        setError('Chưa xác định được kết quả xác nhận. Hãy thử đăng nhập trước khi đăng ký lại; mã đã gửi có thể đã được sử dụng.');
        setPendingRegistration(null);
      }
    },
    onSettled: () => {
      lock.current = false;
      setValues((current) => ({ ...current, password: '', confirmPassword: '', code: '' }));
    },
  });

  function run(action) {
    if (lock.current) return;
    lock.current = true;
    mutation.mutate(action);
  }
  function submit(event) {
    event.preventDefault();
    const validation = validateAuth(values, signup);
    if (pendingRegistration && !/^[0-9]{6}$/.test(values.code)) validation.code = 'Nhập đủ 6 chữ số trong email.';
    setErrors(validation);
    if (!Object.keys(validation).length) run('submit');
  }
  return {
    values, errors, error, authenticated, completionError, pendingRegistration,
    pending: mutation.isPending, submit,
    change: (event) => {
      const { name, type, value, checked } = event.target;
      setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
      setErrors((current) => ({ ...current, [name]: undefined }));
      setError(null);
    },
    blur: () => {},
    resend: () => run('resend'), google: () => run('google'),
    restart: () => { setPendingRegistration(null); setError(null); setErrors({}); },
    retryProfile: () => run('profile'), finishCompletion: finish,
  };
}
