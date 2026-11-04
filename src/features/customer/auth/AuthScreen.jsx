import { useLocation } from 'react-router-dom';
import product from '../../../assets/auth/product.png';
import AuthForm from './AuthForm';
import { getSafeReturnDestination } from './navigation';
import './AuthScreen.css';

function AuthScreen({ mode }) {
  const signup = mode === 'signup';
  const location = useLocation();
  const destination = getSafeReturnDestination(location.state?.from, location.search);

  return (
    <section className="auth-screen" aria-label={signup ? 'Đăng ký tài khoản' : 'Đăng nhập tài khoản'}>
      <aside className="auth-screen__context" aria-label="Ngữ cảnh tài khoản">
        <h2 className="auth-screen__headline">
          {signup ? (
            <>
              Một tài khoản.<br />Trọn hành trình mua sắm.
            </>
          ) : (
            <>
              Trở lại giỏ hàng.<br />Tiếp tục lựa chọn của bạn.
            </>
          )}
        </h2>
        <div className="auth-screen__product">
          <img src={product} alt="iPhone màu bạc" />
        </div>
        <div className="auth-screen__divider" />
      </aside>
      <AuthForm key={mode} signup={signup} destination={destination} />
    </section>
  );
}

export default AuthScreen;
