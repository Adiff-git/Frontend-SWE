import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import useAuth from '../../../hooks/useAuth';
import { createImageUpload, uploadImageBytes, completeImageUpload } from '../../../api/media';
import { tokens } from '../../../api/tokenStore';
import { assertSession } from '../../../api/client';

export default function AvatarControls() {
  const { updateProfile } = useAuth();
  const inputRef = useRef(null);
  const [notice, setNotice] = useState(null);
  const mutation = useMutation({
    retry: false,
    gcTime: 0,
    mutationFn: async (file) => {
      const owner = tokens.getGeneration();
      setNotice(null);
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('INVALID_IMAGE_TYPE');
      }
      const upload = await createImageUpload(file.type);
      assertSession(owner);
      await uploadImageBytes(upload.uploadUrl, file);
      assertSession(owner);
      await completeImageUpload(upload.id);
      assertSession(owner);
      await updateProfile({ profileImageId: upload.id });
      assertSession(owner);
      setNotice('Đã cập nhật ảnh đại diện.');
    },
    onError: (error) => {
      if (error.code === 'SESSION_CHANGED') return;
      setNotice(error.message === 'INVALID_IMAGE_TYPE'
        ? 'Chọn ảnh JPEG, PNG hoặc WebP.'
        : 'Chưa cập nhật được ảnh đại diện. Vui lòng thử lại.');
    },
  });

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        disabled={mutation.isPending}
        aria-label="Chọn ảnh đại diện"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) mutation.mutate(file);
        }}
      />
      <button
        type="button"
        className="profile-screen__avatar-change"
        disabled={mutation.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {mutation.isPending ? 'Đang cập nhật ảnh…' : 'Thay đổi ảnh đại diện'}
      </button>
      {notice && <p className="profile-screen__avatar-notice" role="status">{notice}</p>}
    </>
  );
}
