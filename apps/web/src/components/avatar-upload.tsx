'use client';

import { useState, useRef } from 'react';
import { Button, Flex, Text, Avatar } from '@radix-ui/themes';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Camera } from 'lucide-react';

export function AvatarUpload() {
  const { user, updateUser } = useAuth(); // We might need to refresh user data
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
      // Upload avatar
      const updatedUser = await authAPI.uploadAvatar(file);
      
      // Update local user state
      updateUser(updatedUser);
      alert('头像上传成功');
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error instanceof Error ? error.message : '上传失败');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const avatarUrl = user?.avatarUrl 
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${process.env.NEXT_PUBLIC_API_URL}${user.avatarUrl}`)
    : undefined;

  return (
    <Flex direction="column" align="center" gap="3">
       <div className="relative group cursor-pointer" onClick={onAvatarClick}>
        <Avatar
          size="8"
          src={avatarUrl}
          fallback={user?.name?.[0]?.toUpperCase() || 'U'}
          radius="full"
          className="w-32 h-32 text-4xl" 
          // Note: Radix Avatar size is mapped, '8' is usually 64px or similar. 
          // We might want larger. standard text-4xl might not work inside fallback if not handled.
        />
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
