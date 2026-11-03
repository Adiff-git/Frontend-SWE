import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/auth/logo.png'
import grid from '../../../assets/auth/grid.svg'
import search from '../../../assets/auth/search.svg'
import bag from '../../../assets/auth/bag.svg'
import user from '../../../assets/auth/user.svg'

function AuthHeader() {
  const navigate = useNavigate()
  function submitSearch(event) {
    event.preventDefault()
    const query = new FormData(event.currentTarget).get('q').trim()
    navigate(query ? `/products?q=${encodeURIComponent(query)}` : '/products')
  }
  return (
    <header className="auth-layout__header">
      <Link className="auth-layout__logo" to="/" aria-label="Chạm Tech — Trang chủ"><img src={logo} alt="Chạm Tech" /></Link>
      <Link className="auth-layout__category" to="/products"><img src={grid} alt="" width="18" height="18" />Danh mục</Link>
      <nav className="auth-layout__nav" aria-label="Điều hướng chính">
        <Link to="/">Trang chủ</Link><Link to="/products">Sản phẩm</Link><Link to="/profile/orders">Tra cứu đơn</Link>
      </nav>
      <form className="auth-layout__search" role="search" onSubmit={submitSearch}>
        <button type="submit" aria-label="Tìm kiếm"><img src={search} alt="" width="18" height="18" /></button>
        <input name="q" aria-label="Tìm sản phẩm" placeholder="Tìm sản phẩm" type="search" />
      </form>
      <Link className="auth-layout__cart" to="/cart" aria-label="Giỏ hàng"><img src={bag} alt="" width="20" height="20" /></Link>
      <Link className="auth-layout__account" to="/login"><img src={user} alt="" width="18" height="18" /><span>Đăng nhập</span></Link>
    </header>
  )
}

export default AuthHeader
