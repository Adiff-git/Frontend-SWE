import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import useAuth from '../../../hooks/useAuth';
import { authErrorMessage, googleAuthErrorMessage, validateAuth } from './authValidation';
import { beginGoogle } from './googleFlow';
import { signupSessionStore } from './signupSessionStore';

export default function useAuthForm(signup, destination = '/') {
  const auth = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [completionError, setCompletionError] = useState(null);

  const lock = useRef(false);
  const flowGeneration = useRef(0);
  const { setCompletingAuth } = auth;

  useEffect(() => {
    return () => {
      flowGeneration.current += 1;
      setCompletingAuth(false);
    };
  }, [setCompletingAuth]);

  function finish() {
    auth.setCompletingAuth(false);
    navigate(destination, { replace: true });
  }

  const mutation = useMutation({
    gcTime: 0,
    retry: false,
    mutationFn: async (action) => {
      setError(null);
      if (action === 'google') {
        await beginGoogle({ destination, remember: values.remember });
        return;
      }

      if (signup) {
        const currentGeneration = flowGeneration.current;
        const pending = await auth.register(values.email.trim(), values.password);

        // If user navigated away or restarted while register was pending, discard response
        if (flowGeneration.current !== currentGeneration) {
          return;
        }

        signupSessionStore.set({
          pendingRegistration: pending,
          email: values.email.trim(),
          password: values.password,
          displayName: values.displayName.trim(),
          destination,
        });

        navigate('/signup/verify');
        return;
      }

      if (!authenticated) {
        auth.setCompletingAuth(true);
        const result = await auth.login(values.email.trim(), values.password, {
          remember: values.remember,
        });
        setAuthenticated(true);
        if (result.profileError) {
          setCompletionError(
            'Đã đăng nhập nhưng chưa tải được hồ sơ. Bạn có thể thử tải lại ở trang tiếp theo.',
          );
          return;
        }
      }

      finish();
    },
    onError: (failure, action) => {
      auth.setCompletingAuth(false);
      setErrors(
        Object.fromEntries(
          Object.entries(failure.fieldErrors || {}).map(([key, message]) => [
            key === 'identifier' ? 'email' : key,
            Array.isArray(message) ? message[0] : message,
          ]),
        ),
      );
      setError(
        action === 'google'
          ? googleAuthErrorMessage(failure)
          : failure.code === 'CONTRACT_MISMATCH'
            ? 'Máy chủ chưa hỗ trợ phiên bản đăng ký yêu cầu.'
            : authErrorMessage(failure, signup),
      );
    },
    onSettled: () => {
      lock.current = false;
      setValues((current) => ({ ...current, password: '', confirmPassword: '' }));
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
    setErrors(validation);
    if (!Object.keys(validation).length) run('submit');
  }

  return {
    values,
    errors,
    error,
    authenticated,
    completionError,
    pendingRegistration: null,
    pending: mutation.isPending,
    submit,
    change: (event) => {
      const { name, type, value, checked } = event.target;
      setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
      setErrors((current) => ({ ...current, [name]: undefined }));
      setError(null);
    },
    blur: () => {},
    google: () => run('google'),
    restart: () => {
      flowGeneration.current += 1;
      setError(null);
      setErrors({});
    },
    retryProfile: () => run('profile'),
    finishCompletion: finish,
  };
}
