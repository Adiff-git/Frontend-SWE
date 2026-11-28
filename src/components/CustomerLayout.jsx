import ChatWidget from '../features/assistant/ChatWidget'
import { Outlet } from 'react-router-dom';
import Header from './Header';
import './CustomerLayout.css';

function CustomerLayout({ cartCount = 0 }) {
  return (
    <div className="customer-layout" lang="vi">
      <Header cartCount={cartCount} />
      <main className="customer-layout__content">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
}

export default CustomerLayout;
