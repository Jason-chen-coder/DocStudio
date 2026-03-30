/**
 * 统一构造文件访问 URL。
 * - 开发环境：通过 NEXT_PUBLIC_CDN_URL=http://localhost:9000 直连 MinIO
 * - 生产环境：通过 NEXT_PUBLIC_CDN_URL=https://cdn.xxx.com 经由 Nginx 反代 MinIO
 *
 * 数据库中存储的是相对路径（如 `avatars/abc.png`），
 * 本函数负责拼接为完整可访问 URL。
 */
export function getCdnUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  // 已是完整 URL（兼容旧数据或对方直接存了完整地址）
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = (process.env.NEXT_PUBLIC_CDN_URL ?? 'http://localhost:9000').replace(/\/$/, '');
  return `${base}/${path}`;
}

/**
 * 获取用户头像 URL，当用户没有自定义头像时返回基于姓名首字母生成的默认头像。
 * 使用 ui-avatars.com 服务生成，零依赖、无需本地图片。
 */
export function getAvatarUrl(
  avatarPath?: string | null,
  name?: string | null,
): string {
  const cdn = getCdnUrl(avatarPath);
  if (cdn) return cdn;

  // 生成基于姓名的默认头像
  const displayName = name?.trim() || 'U';
  const encoded = encodeURIComponent(displayName);
  return `https://ui-avatars.com/api/?name=${encoded}&background=6366f1&color=fff&size=128&font-size=0.4&bold=true`;
}
