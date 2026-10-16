import { Solar } from 'lunar-javascript';

const CAN = ['Canh', 'Tân', 'Nhâm', 'Quý', 'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ'];
const CHI = ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi'];

export function lunarText(date: Date) {
  const vn = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const l = Solar.fromYmd(vn.getFullYear(), vn.getMonth() + 1, vn.getDate()).getLunar();
  const m = l.getMonth(); // số âm = tháng nhuận
  const y = l.getYear();
  return `Tức ngày ${l.getDay()} tháng ${Math.abs(m)}${m < 0 ? ' nhuận' : ''} năm ${CAN[y % 10]} ${CHI[y % 12]}`;
}
