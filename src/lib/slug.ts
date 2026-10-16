import { stripVietnamese } from './vietqr';

// "Gia đình em Tính & Tuyết" -> "gia-dinh-em-tinh-tuyet"
export const slugify = (s: string) =>
  stripVietnamese(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');

// Mã trong link /k/[code]: chữ thường không dấu, số và dấu gạch ngang
export const CODE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
