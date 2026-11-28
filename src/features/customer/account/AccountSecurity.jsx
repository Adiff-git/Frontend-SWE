import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { changePassword } from '../../../api/auth';
import { assertSession } from '../../../api/client';
import { tokens } from '../../../api/tokenStore';
import { createEmailChallenge, getEmailChallenge, confirmEmailChallenge, reauthenticate, getGoogleConnection, createInitialPassword } from '../../../api/identity';
import { beginGoogle, takeGoogleProof, clearGoogleProof } from '../auth/googleFlow';
import { validateAuth } from '../auth/authValidation';
import FormField from '../../../components/FormField';
import Button from '../../../components/Button';
import PasswordField from '../auth/PasswordField';
import './AccountSecurity.css';

const deliveryLabels = { QUEUED: 'Đang chờ gửi', SENT: 'Đã gửi', FAILED: 'Gửi thất bại', EXPIRED: 'Đã hết hạn' };

export default function AccountSecurity() {
  const { user, generation, refreshProfile, clearSession } = useAuth();
  const navigate = useNavigate();
  const [googleProof, setGoogleProof] = useState(takeGoogleProof);
  const [destination, setDestination] = useState(() => takeGoogleProof()?.context?.destination || user.email || '');
  const [challenge, setChallenge] = useState(() => takeGoogleProof()?.context?.challenge || null);
  const [purpose, setPurpose] = useState(() => takeGoogleProof()?.context?.purpose || 'EMAIL_CHANGE');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [notice, setNotice] = useState(null);
  const connection = useQuery({
    queryKey: ['googleConnection', user.id, generation],
    queryFn: ({ signal }) => getGoogleConnection({ signal }), retry: false,
  });

  async function proofFor(operation) {
    if (user.hasLocalPassword) return (await reauthenticate(operation, password)).recentAuthProof;
    if (googleProof?.operation !== operation || googleProof.sessionMarker !== tokens.getSessionMarker() || !(Date.parse(googleProof.expiresAt) > Date.now())) {
      throw new Error('Vui lòng xác thực lại bằng Google cho thao tác này.');
    }
    return googleProof.recentAuthProof;
  }

  const action = useMutation({
    retry: false, gcTime: 0,
    mutationFn: async (name) => {
      const owner = tokens.getGeneration();
      setNotice(null);
      if (name === 'challenge' || name === 'verify') {
        const nextPurpose = name === 'verify' ? 'REGISTRATION' : 'EMAIL_CHANGE';
        const target = name === 'verify' ? user.email : destination.trim();
        const invalid = validateAuth({ email: target, password: 'password123', confirmPassword: 'password123' }, true).email;
        if (invalid) throw new Error(invalid);
        const result = await createEmailChallenge(nextPurpose, target);
        assertSession(owner);
        setPurpose(nextPurpose);
        setChallenge(result);
        setCode('');
        setNotice('Đã tạo yêu cầu xác nhận. Trạng thái gửi email được hiển thị bên dưới.');
      } else if (name === 'status') {
        const result = await getEmailChallenge(challenge.id);
        assertSession(owner);
        setChallenge(result);
      } else if (name === 'confirm') {
        if (!/^[0-9]{6}$/.test(code)) throw new Error('Mã xác nhận phải gồm 6 chữ số.');
        const proof = purpose === 'EMAIL_CHANGE' ? await proofFor('EMAIL_CHANGE') : undefined;
        try { await confirmEmailChallenge(challenge.id, code, proof); }
        finally { clearGoogleProof(); setGoogleProof(null); }
        assertSession(owner);
        await refreshProfile();
        setChallenge(null);
        setNotice('Email đã được xác nhận.');
      } else if (name.startsWith('reauth:')) {
        await beginGoogle({ mode: 'REAUTH', operation: name.split(':')[1], context: { challenge, purpose, destination } });
      } else if (name === 'link') {
        const proof = await proofFor('CONNECT_GOOGLE');
        clearGoogleProof();
        setGoogleProof(null);
        await beginGoogle({ mode: 'LINK', recentAuthProof: proof });
      } else if (name === 'password') {
        const invalid = validateAuth({ email: 'validation@example.test', password: newPassword, confirmPassword: confirmation }, true);
        if (invalid.password || invalid.confirmPassword) throw new Error(invalid.password || invalid.confirmPassword);
        if (user.hasLocalPassword) await changePassword(password, newPassword);
        else {
          const proof = await proofFor('INITIAL_PASSWORD');
          try { await createInitialPassword(newPassword, proof); }
          finally { clearGoogleProof(); setGoogleProof(null); }
        }
        assertSession(owner);
        clearSession();
        navigate('/login', { replace: true, state: { passwordChanged: true } });
      }
    },
    onError: async (error) => {
      if (error.code === 'SESSION_CHANGED') return;
      setNotice(error.status === 0 || error.status >= 500
        ? 'Chưa xác định được kết quả yêu cầu. Hãy tải lại trạng thái tài khoản trước khi thử lại thao tác.'
        : error.message || 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.');
      if (error.status === 409) await refreshProfile().catch(() => {});
    },
    onSettled: () => { setPassword(''); setNewPassword(''); setConfirmation(''); setCode(''); },
  });
  const pending = action.isPending;
  return <section className="account-security" aria-labelledby="account-security-title">
    <h2 id="account-security-title">Email và bảo mật</h2>
    <p>Email hiện tại: <strong>{user.email || 'Chưa có email'}</strong> — {user.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}</p>
    {notice && <p role="status" className="account-security__notice">{notice}</p>}
    <Button variant="secondary" onClick={() => refreshProfile().catch(() => setNotice('Chưa tải được hồ sơ.'))} disabled={pending}>Tải lại trạng thái tài khoản</Button>
    <fieldset disabled={pending} className="account-security__fields">
      <legend>Xác nhận / thay đổi email</legend>
      {!user.emailVerified && user.email && <Button variant="secondary" onClick={() => action.mutate('verify')}>Xác thực email hiện tại</Button>}
      <FormField label="Email mới" type="email" value={destination} onChange={(event) => setDestination(event.target.value)} />
      <Button variant="secondary" onClick={() => action.mutate('challenge')}>Gửi mã tới email mới</Button>
      {challenge && <>
        <p role="status">{deliveryLabels[challenge.deliveryStatus] || 'Chưa rõ trạng thái'} · Hết hạn: {new Date(challenge.expiresAt).toLocaleString('vi-VN')}</p>
        <Button variant="secondary" onClick={() => action.mutate('status')}>Kiểm tra trạng thái gửi</Button>
        <FormField label="Mã xác nhận email" inputMode="numeric" autoComplete="one-time-code" value={code} maxLength={6} onChange={(event) => setCode(event.target.value)} />
        {purpose === 'EMAIL_CHANGE' && !user.hasLocalPassword && <Button variant="secondary" onClick={() => action.mutate('reauth:EMAIL_CHANGE')}>Xác thực lại bằng Google để đổi email</Button>}
        <Button onClick={() => action.mutate('confirm')}>Xác nhận email</Button>
      </>}
    </fieldset>
    <fieldset disabled={pending} className="account-security__fields">
      <legend>Xác thực tài khoản</legend>
      {user.hasLocalPassword ? <PasswordField label="Mật khẩu hiện tại" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" hint="Nhập để xác nhận thao tác đổi email, mật khẩu hoặc liên kết Google." />
        : <p>Tài khoản dùng Google. Xác thực lại bằng tài khoản Google đã liên kết trước thao tác nhạy cảm.</p>}
      <p>{connection.isPending ? 'Đang tải kết nối Google…' : connection.isError ? 'Chưa tải được trạng thái Google.' : connection.data.connected ? 'Đã liên kết Google' : 'Chưa liên kết Google'}</p>
      {connection.isError && <Button variant="secondary" onClick={() => connection.refetch()}>Tải lại kết nối</Button>}
      {connection.data?.connected === false && <>
        {!user.hasLocalPassword && <Button variant="secondary" onClick={() => action.mutate('reauth:CONNECT_GOOGLE')}>Xác thực Google để liên kết</Button>}
        <Button variant="secondary" onClick={() => action.mutate('link')}>Liên kết Google</Button>
      </>}
      {googleProof && <p role="status">Đã xác thực cho thao tác {googleProof.operation}. Hoàn tất trước {new Date(googleProof.expiresAt).toLocaleTimeString('vi-VN')}.</p>}
    </fieldset>
    <form onSubmit={(event) => { event.preventDefault(); if (!pending) action.mutate('password'); }}>
      <fieldset disabled={pending} className="account-security__fields">
        <legend>{user.hasLocalPassword ? 'Đổi mật khẩu' : 'Tạo mật khẩu đăng nhập'}</legend>
        <PasswordField label="Mật khẩu mới" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" />
        <PasswordField label="Xác nhận mật khẩu mới" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" />
        {!user.hasLocalPassword && <Button variant="secondary" onClick={() => action.mutate('reauth:INITIAL_PASSWORD')}>Xác thực Google để tạo mật khẩu</Button>}
        <p>Đổi hoặc tạo mật khẩu thành công sẽ đăng xuất tất cả phiên. Bạn cần đăng nhập lại.</p>
        <Button type="submit" loading={pending}>Lưu mật khẩu</Button>
      </fieldset>
    </form>
  </section>;
}
