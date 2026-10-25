import { NavLink, Outlet, useLocation } from 'react-router-dom'
import './AdminLayout.css'

// Shared page frame: a top bar with a switch button, and the current page below it.
function AdminLayout() {
  const { pathname } = useLocation()
  const inAdmin = pathname.startsWith('/admin')

  return (
    <div className="layout">
      <header className="layout__bar">
        <span className="layout__title">Electronics Store</span>
        <nav className="layout__nav">
          <NavLink to="/" end className="layout__link">
            Storefront
          </NavLink>
          <NavLink to="/admin" className="layout__link">
            Admin
          </NavLink>
        </nav>
        {/* A single button that jumps to the other side of the site */}
        <NavLink
          to={inAdmin ? '/' : '/admin'}
          className="layout__switch"
        >
          Switch to {inAdmin ? 'storefront' : 'admin'}
        </NavLink>
      </header>
      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
