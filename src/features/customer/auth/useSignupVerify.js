import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { resendRegistration } from '../../../api/auth';
import { authErrorMessage } from './authValidation';
import { signupSessionStore } from './signupSessionStore';

export default function useSignupVerify() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { setCompletingAuth, confirmSignup, updateProfile } = auth;

  const initial = signupSessionStore.get();
  const sessionId = useRef(initial?.id).current;

  const credentialsRef = useRef(
    initial
      ? {
          password: initial.password,
          pendingRegistration: initial.pendingRegistration,
        }
      : null,
  );

  const [summary] = useState(() => ({
    email: initial?.email || '',
    displayName: initial?.displayName || '',
    destination: initial?.destination || '/',
  }));

  const [stage, setStage] = useState(() =>
    signupSessionStore.hasSession() ? 'verifying' : 'missing',
  );

  const [code, setCode] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [completionError, setCompletionError] = useState(null);
  const [completionErrorKind, setCompletionErrorKind] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const lock = useRef(false);
  const isMountedRef = useRef(true);
  const flowGeneration = useRef(0);

  // Dedicated unmount cleanup: ALWAYS reset completing auth
  useLayoutEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      flowGeneration.current += 1;
      setCompletingAuth(false);
    };
  }, [setCompletingAuth]);

  // If initial stage is missing, redirect safely to /signup
  useEffect(() => {
    if (stage === 'missing') {
      navigate('/signup', { replace: true });
    }
  }, [stage, navigate]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-dismiss resend notice after 4s or on user interaction elsewhere
  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => {
      setNotice(null);
    }, 4000);

    function handleInteraction(e) {
      if (e.target.closest?.('.signup-verify__notice--info')) return;
      setNotice(null);
    }

    const interactionTimeout = setTimeout(() => {
      document.addEventListener('click', handleInteraction);
      document.addEventListener('keydown', handleInteraction);
    }, 100);

    return () => {
      clearTimeout(timer);
      clearTimeout(interactionTimeout);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [notice]);

  function finish() {
    setCompletingAuth(false);
    navigate(summary.destination || '/', { replace: true });
  }

  function isCurrent(generation) {
    // History changes before concurrent route unmounts commit.
    return isMountedRef.current && flowGeneration.current === generation
      && window.location.pathname === '/signup/verify';
  }

  function handleCancel() {
    flowGeneration.current += 1;
    setCompletingAuth(false);
    credentialsRef.current = null;
    signupSessionStore.clear(sessionId);
    navigate('/signup');
  }

  function handleCodeChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(raw);
    if (errors.code) {
      setErrors((prev) => ({ ...prev, code: undefined }));
    }
    setError(null);
  }

  async function handleResend() {
    if (lock.current || isResending || resendCooldown > 0 || stage !== 'verifying') return;
    if (!credentialsRef.current?.pendingRegistration) return;

    lock.current = true;
    setIsResending(true);
    setError(null);
    setNotice(null);

    const requestGeneration = flowGeneration.current;
    try {
      const nextPending = await resendRegistration(credentialsRef.current.pendingRegistration);
      if (!isCurrent(requestGeneration) || !credentialsRef.current) return;
      if (!signupSessionStore.updatePending(sessionId, nextPending)) return;
      credentialsRef.current.pendingRegistration = nextPending;
      setNotice('Đã gửi lại mã xác nhận mới đến email của bạn.');
      setResendCooldown(60);
    } catch (err) {
      if (!isCurrent(requestGeneration)) return;
      if (err.status === 0 || err.status >= 500) {
        credentialsRef.current = null;
        signupSessionStore.clear(sessionId);
        setStage('invalidated');
        setError('Chưa thể xác nhận việc gửi lại mã do sự cố kết nối. Vui lòng đăng ký lại.');
      } else {
        setError(authErrorMessage(err, true));
      }
    } finally {
      if (isCurrent(requestGeneration)) {
        setIsResending(false);
        lock.current = false;
      }
    }
  }

  async function handleConfirm(e) {
    if (e) e.preventDefault();
    if (lock.current || isSubmitting || stage !== 'verifying') {
      return;
    }

    setError(null);
    setNotice(null);

    const trimmedCode = (code || '').trim();
    if (!/^[0-9]{6}$/.test(trimmedCode)) {
      setErrors({ code: 'Vui lòng nhập đủ 6 chữ số mã xác nhận.' });
      return;
    }
    setErrors({});

    if (!credentialsRef.current?.pendingRegistration || !credentialsRef.current?.password) {
      credentialsRef.current = null;
      signupSessionStore.clear(sessionId);
      setStage('invalidated');
      setError('Phiên xác thực đã hết hạn hoặc không hợp lệ. Vui lòng đăng ký lại.');
      return;
    }

    lock.current = true;
    setIsSubmitting(true);
    setCompletingAuth(true);

    const requestGeneration = flowGeneration.current;
    try {
      const result = await confirmSignup(
        credentialsRef.current.pendingRegistration,
        trimmedCode,
        credentialsRef.current.password,
        {
          remember: false,
          isCurrent: () => isCurrent(requestGeneration) && signupSessionStore.get()?.id === sessionId,
        },
      );
      if (!isCurrent(requestGeneration) || signupSessionStore.get()?.id !== sessionId) return;

      // Immediately zero credentials and advance stage upon 201 Created
      credentialsRef.current = null;
      signupSessionStore.clear(sessionId);
      setStage('completed');

      if (result.profileError) {
        setCompletionErrorKind('profile-load');
        setCompletionError(
          'Đã đăng nhập nhưng chưa tải được hồ sơ. Bạn có thể thử tải lại ở trang tiếp theo.',
        );
        return;
      }

      if (summary.displayName) {
        try {
          await updateProfile(summary.displayName);
        } catch {
          if (!isCurrent(requestGeneration)) return;
          setCompletionErrorKind('profile-save');
          setCompletionError(
            'Tài khoản đã tạo thành công nhưng chưa lưu được tên hiển thị. Bạn có thể thử lại hoặc cập nhật sau trong hồ sơ.',
          );
          return;
        }
      }

      if (!isCurrent(requestGeneration)) return;
      finish();
    } catch (failure) {
      if (!isCurrent(requestGeneration)) return;
      // Failure during confirm: reset completing auth immediately
      setCompletingAuth(false);

      if (failure.status === 0 || failure.status >= 500) {
        credentialsRef.current = null;
        signupSessionStore.clear(sessionId);
        setStage('invalidated');
        setError(
          'Chưa xác định được kết quả xác nhận. Hãy thử đăng nhập trước khi đăng ký lại; mã đã gửi có thể đã được sử dụng.',
        );
      } else if (failure.status === 400) {
        setError('Mã xác thực không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại.');
      } else if (failure.status === 409) {
        setError('Email đã được đăng ký hoặc yêu cầu đang xung đột. Vui lòng đăng nhập.');
      } else {
        setError(authErrorMessage(failure, true));
      }
    } finally {
      if (isCurrent(requestGeneration)) {
        setIsSubmitting(false);
        lock.current = false;
      }
    }
  }

  async function retryProfile() {
    if (lock.current || isSubmitting || completionErrorKind !== 'profile-save' || !summary.displayName) return;
    lock.current = true;
    setIsSubmitting(true);
    const requestGeneration = flowGeneration.current;
    try {
      await updateProfile(summary.displayName);
      if (!isCurrent(requestGeneration)) return;
      finish();
    } catch {
      if (!isCurrent(requestGeneration)) return;
      setCompletionError(
        'Vẫn chưa lưu được tên hiển thị. Bạn có thể cập nhật sau trong trang hồ sơ.',
      );
    } finally {
      if (isCurrent(requestGeneration)) {
        setIsSubmitting(false);
        lock.current = false;
      }
    }
  }

  return {
    stage,
    summary,
    code,
    errors,
    error,
    notice,
    completionError,
    completionErrorKind,
    isSubmitting,
    isResending,
    resendCooldown,
    handleCodeChange,
    handleConfirm,
    handleResend,
    handleCancel,
    retryProfile,
    finish,
  };
}
