import path from 'node:path';
import { mkdir } from 'node:fs/promises';

export const uploadDir = () => path.resolve(process.env.UPLOAD_DIR ?? './data/uploads');

export async function ensureUploadDir() {
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  return dir;
}

// Chỉ chấp nhận tên file đơn giản, không có ".." hoặc "/"
export const safeFileName = (name: string) => /^[\w-]+(\.[\w]+)?$/.test(name);
