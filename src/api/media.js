import { api, ApiError } from './client.js';
export const createImageUpload = (contentType) => api.post('/api/image-uploads', { contentType }, { autoRefresh: false });
export const completeImageUpload = (id) => api.post(`/api/image-uploads/${encodeURIComponent(id)}/complete`, undefined, { autoRefresh: false });
export const getImageDownloadUrl = (id) => api.get(`/api/image-uploads/${encodeURIComponent(id)}/download-url`);

export async function uploadImageBytes(uploadUrl, file) {
  const url = new URL(uploadUrl);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new ApiError(400, 'Đường dẫn tải ảnh không hợp lệ.');
  let response;
  try {
    response = await fetch(uploadUrl, {
      method: 'PUT', headers: { 'Content-Type': file.type }, body: file,
      credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error',
    });
  } catch { throw new ApiError(0, 'Không thể tải ảnh lên. Vui lòng kiểm tra kết nối.'); }
  if (!response.ok) throw new ApiError(response.status, 'Không thể tải ảnh lên kho lưu trữ. Vui lòng chọn lại ảnh.');
}
