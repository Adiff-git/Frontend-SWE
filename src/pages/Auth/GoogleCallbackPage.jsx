import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { finishGoogle } from '../../features/customer/auth/googleFlow';

export default function GoogleCallbackPage({ callback }) {
  const { acceptSession } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    finishGoogle(callback).then(async (result) => {
      if (!active) return;
      if (result.session) await acceptSession(result.session);
      if (active) navigate(result.destination, { replace: true });
    }).catch((failure) => {
      if (active) setError(failure.code === 'ACCOUNT_CONNECTION_REQUIRED'
        ? 'Email đã thuộc một tài khoản khác. Hãy đăng nhập tài khoản đó rồi liên kết Google trong hồ sơ.'
        : 'Chưa hoàn tất xác thực Google. Nếu kết quả bị gián đoạn, hãy kiểm tra trạng thái tài khoản trước khi thử lại.');
    });
    return () => { active = false; };
  }, [callback, acceptSession, navigate]);
  return <main className="route-guard"><div className="route-guard__card">
    <h1>Xác thực Google</h1>
    {error ? <><p role="alert">{error}</p><Link to="/login">Đăng nhập</Link><p><Link to="/profile/info">Về hồ sơ</Link></p></>
      : <p role="status">Đang hoàn tất xác thực…</p>}
  </div></main>;
}
