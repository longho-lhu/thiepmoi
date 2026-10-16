const tlv = (id: string, v: string) => id + String(v.length).padStart(2, '0') + v;

function crc16(s: string) {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// note: viết không dấu, VD "Mung cuoi Khang Dieu Anh"
export function vietQrPayload(bin: string, accountNo: string, note = 'Mung cuoi') {
  const merchant = tlv('00', 'A000000727') + tlv('01', tlv('00', bin) + tlv('01', accountNo)) + tlv('02', 'QRIBFTTA');
  const body = tlv('00', '01') + tlv('01', '11') + tlv('38', merchant) + tlv('53', '704') + tlv('58', 'VN') + tlv('62', tlv('08', note));
  return body + '6304' + crc16(body + '6304');
}

// "Mừng cưới Khang Diệu Anh" -> "Mung cuoi Khang Dieu Anh"
export const stripVietnamese = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
