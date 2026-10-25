import { Routes, Route } from 'react-router-dom'
import CustomerLayout from './components/CustomerLayout'
import AdminLayout from './components/AdminLayout'
import AuthLayout from './components/AuthLayout'
import HomePage from './pages/Customer/HomePage'
import ProductListingPage from './pages/Customer/ProductListingPage'
import ProductPage from './pages/Customer/ProductPage'
import ProfileInfoPage from './pages/Customer/ProfileInfoPage'
import OrdersPage from './pages/Customer/OrdersPage'
import CartPage from './pages/Customer/CartPage'
import CheckoutPage from './pages/Customer/CheckoutPage'
import NotFoundPage from './pages/Customer/NotFoundPage'
import AdminPage from './pages/Admin/AdminPage'
import AdminProductPage from './pages/Admin/AdminProductPage'
import LoginPage from './pages/Auth/LoginPage'
import SignupPage from './pages/Auth/SignupPage'
import ForgotPassPage from './pages/Auth/ForgotPassPage'
import ResetPassPage from './pages/Auth/ResetPassPage'

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login/forget" element={<ForgotPassPage />} />
        <Route path="/login/reset" element={<ResetPassPage />} />
      </Route>

      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListingPage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/profile/info" element={<ProfileInfoPage />} />
        <Route path="/profile/orders" element={<OrdersPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/products/:id" element={<AdminProductPage />} />
      </Route>
    </Routes>

    
  )
}

export default App
