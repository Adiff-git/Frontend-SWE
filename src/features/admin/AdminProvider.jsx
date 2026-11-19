import { useEffect, useRef, useState } from 'react';
import { AdminContext } from './adminContext';
import { createCatalog } from './catalogModel';
import { resetMedia } from './previewMedia';
import { resetDrafts } from './useDraftNavigation';

export default function AdminProvider({ children }) {
  const [catalog, setCatalog] = useState(createCatalog);
  const current = useRef(catalog);
  const [notice, setNotice] = useState('');
  const [scenario, setScenario] = useState('normal');
  const scenarioRef = useRef(scenario);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  const updateScenario = (value) => { scenarioRef.current = value; setScenario(value); };
  const mutate = (transform) => {
    if (scenarioRef.current === 'error') throw new Error('Chưa thể lưu thay đổi. Dữ liệu nháp đã được giữ lại, vui lòng thử lại.');
    if (scenarioRef.current === 'conflict') throw new Error('Dữ liệu đã thay đổi. Tải lại phiên bản đã lưu và kiểm tra trước khi lưu.');
    if (scenarioRef.current === 'unknown') throw new Error('Chưa xác nhận được kết quả. Tải lại dữ liệu đã lưu trước khi thử lại.');
    if (['forbidden', 'loading', 'empty'].includes(scenarioRef.current)) throw new Error('Thao tác hiện không khả dụng. Vui lòng kiểm tra quyền truy cập hoặc tải lại trang.');
    const next = transform(current.current);
    current.current = next;
    setCatalog(next);
    setNotice('Đã lưu thay đổi.');
  };
  const reset = () => { resetDrafts(); resetMedia(); const next = createCatalog(); current.current = next; setCatalog(next); updateScenario('normal'); setNotice('Đã khôi phục dữ liệu.'); };
  return <AdminContext.Provider value={{ catalog, mutate, notice, setNotice, scenario, setScenario: updateScenario, reset }}>{children}</AdminContext.Provider>;
}
