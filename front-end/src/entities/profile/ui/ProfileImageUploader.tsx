import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ProfileImageUploaderProps {
  onFileChange: (file: File | null) => void;
  initialImageUrl?: string;
}

export default function ProfileImageUploader({
  onFileChange,
  initialImageUrl,
}: ProfileImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onFileChange(file);
    setLoadFailed(false);

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (initialImageUrl && !previewUrl) {
      setLoadFailed(false);
      setPreviewUrl(initialImageUrl);
    }
  }, [initialImageUrl, previewUrl]);

  const imageSrc = !loadFailed && previewUrl ? previewUrl : '/img/profile.svg';

  return (
    <div className='relative mb-6 h-[100px] w-[100px] rounded-full border border-gray-200'>
      <Image
        src={imageSrc}
        alt='프로필 이미지'
        fill
        unoptimized
        className='rounded-full object-cover'
        onError={() => setLoadFailed(true)}
      />
      <label
        htmlFor='profileImageUpload'
        className='hover:border-main absolute right-0 bottom-0 z-1 h-[40px] w-[40px] cursor-pointer rounded-full border border-gray-200 bg-white hover:border-2'
      >
        <Image
          src='/img/edit.svg'
          alt='수정 아이콘'
          width={18}
          height={18}
          className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        />
        <input
          type='file'
          accept='image/*'
          id='profileImageUpload'
          className='hidden'
          onChange={handleImageChange}
        />
      </label>
    </div>
  );
}
