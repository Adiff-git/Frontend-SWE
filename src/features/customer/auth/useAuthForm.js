import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import useAuth from '../../../hooks/useAuth';
import { authErrorMessage, validateAuth } from './authValidation';

export default function useAuthForm(signup) {
  const {
    login: ctxLogin,
    register: ctxRegister,
    updateProfile: ctxUpdateProfile,
    retryBootstrap,
    setCompletingAuth,
  } = useAuth();

  const [values, setValues] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    remember: false,
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const submitLock = useRef(false);

  const profile = useMutation({
    mutationFn: (displayName) => ctxUpdateProfile(displayName),
    retry: false,
  });

  const session = useMutation({
    mutationFn: (form) =>
      (signup ? ctxRegister : ctxLogin)(form.username.trim(), form.password, {
        remember: form.remember,
      }),
    retry: false,
    onSuccess: (_, form) => {
      setAuthenticated(true);
      setCompletingAuth(true);
      setValues((current) => ({ ...current, password: '', confirmPassword: '' }));
      if (signup && form.displayName.trim()) {
        profile.mutate(form.displayName.trim());
      }
    },
    onSettled: () => {
      submitLock.current = false;
    },
  });

  const validation = validateAuth(values, signup);
  const errors = Object.fromEntries(
    Object.entries(validation).filter(([name]) => submitted || touched[name]),
  );

  for (const [field, messages] of Object.entries(session.error?.fieldErrors || {})) {
    const name = field === 'identifier' ? 'username' : field;
    if (Array.isArray(messages) && typeof messages[0] === 'string') {
      errors[name] = messages[0];
    }
  }

  function change(event) {
    const { name, type, checked, value } = event.target;
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    if (session.isError) session.reset();
  }

  function submit(event) {
    event.preventDefault();
    if (submitLock.current || authenticated) return;
    setSubmitted(true);
    if (Object.keys(validation).length) {
      const name = Object.keys(validation)[0];
      event.currentTarget.elements.namedItem(name)?.focus();
      return;
    }
    submitLock.current = true;
    session.mutate(values);
  }

  return {
    values,
    errors,
    authenticated,
    profile,
    profileBootstrapError: session.data?.profileError,
    pending: session.isPending,
    error: session.error && authErrorMessage(session.error, signup),
    change,
    submit,
    blur: (event) => setTouched((current) => ({ ...current, [event.target.name]: true })),
    retryProfile: () => profile.mutate(values.displayName.trim()),
    retryBootstrap,
    finishCompletion: () => setCompletingAuth(false),
  };
}
