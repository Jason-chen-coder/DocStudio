'use client';

import { useState, useRef } from 'react';
import { Button, Flex, Text } from '@radix-ui/themes';
import Image from 'next/image';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Camera } from 'lucide-react';
import { getCdnUrl } from '@/lib/cdn';

export function AvatarUpload() {
  const { user, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    try {
      setIsUploading(true);
      const updatedUser = await authAPI.uploadAvatar(file);
      updateUser(updatedUser);
      alert('头像上传成功');
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error instanceof Error ? error.message : '上传失败');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const avatarUrl = getCdnUrl(user?.avatarUrl);
  const fallbackLetter = user?.name?.[0]?.toUpperCase() || 'U';

  return (
    <Flex direction="column" align="center" gap="3">
      <div className="relative group cursor-pointer" onClick={onAvatarClick}>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={user?.name || 'Avatar'}
            width={128}
            height={128}
            unoptimized
            className="rounded-full object-cover w-32 h-32"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-4xl font-semibold select-none">
            {fallbackLetter}
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-8 h-8 text-white" />
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/gif"
        className="hidden"
      />

      <Button
        variant="soft"
        onClick={onAvatarClick}
        loading={isUploading}
        disabled={isUploading}
      >
        {isUploading ? '上传中...' : '更换头像'}
      </Button>
      <Text size="1" color="gray">支持 JPG, PNG, GIF (最大 5MB)</Text>
    </Flex>
  );
}
