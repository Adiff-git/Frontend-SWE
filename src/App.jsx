import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from './components/CustomerLayout';
import AuthLayout from './components/AuthLayout';
import SignupSessionCleanup from './features/customer/auth/SignupSessionCleanup';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import AdminBoundary from './components/AdminBoundary';
import LogoutConfirmationProvider from './features/customer/account/LogoutConfirmationProvider';
import AccountLayout from './features/customer/account/AccountLayout';
import HomePage from './pages/Customer/HomePage';
import ProductListingPage from './pages/Customer/ProductListingPage';
import ProductPage from './pages/Customer/ProductPage';
import ProfileInfoPage from './pages/Customer/ProfileInfoPage';
import OrdersPage from './pages/Customer/OrdersPage';
import AddressesPage from './pages/Customer/AddressesPage';
import CartPage from './pages/Customer/CartPage';
import CheckoutPage from './pages/Customer/CheckoutPage';
import NotFoundPage from './pages/Customer/NotFoundPage';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import SignupVerifyPage from './pages/Auth/SignupVerifyPage';
import ForgotPassPage from './pages/Auth/ForgotPassPage';
import ResetPassPage from './pages/Auth/ResetPassPage';
import GoogleCallbackPage from './pages/Auth/GoogleCallbackPage';

function App({ googleCallback }) {
  return (
    <LogoutConfirmationProvider>
      <SignupSessionCleanup />
      <Routes>
        <Route path="/auth/google/callback" element={<GoogleCallbackPage callback={googleCallback} />} />
        <Route path="/auth/google/error" element={<GoogleCallbackPage callback={googleCallback} />} />
        {/* Auth routes with GuestRoute protection */}
        <Route element={<AuthLayout />}>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signup/verify" element={<SignupVerifyPage />} />
            <Route path="/register" element={<Navigate to="/signup" replace />} />
            <Route path="/register/verify" element={<Navigate to="/signup/verify" replace />} />
            <Route path="/login/forget" element={<ForgotPassPage />} />
            <Route path="/login/reset" element={<ResetPassPage />} />
          </Route>
        </Route>

        {/* Customer Storefront layout */}
        <Route element={<CustomerLayout />}>
          {/* Public customer routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />

          {/* Protected customer routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AccountLayout />}>
              <Route path="/profile" element={<Navigate to="/profile/info" replace />} />
              <Route path="/profile/info" element={<ProfileInfoPage />} />
              <Route path="/profile/orders" element={<OrdersPage />} />
              <Route path="/profile/addresses" element={<AddressesPage />} />
            </Route>
            <Route path="/checkout" element={<CheckoutPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin boundary: temporary fail-closed until role authorization contract exists */}
        <Route element={<AdminBoundary />}>
          <Route path="/admin/*" element={null} />
        </Route>
      </Routes>
    </LogoutConfirmationProvider>
  );
}

export default App;
