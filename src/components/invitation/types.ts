export type Person = { name: string; role: string; father: string; mother: string; address: string };

export type WishItem = { id: number; name: string; content: string; createdAt: string };

export type GiftAccount = {
  who: string;
  bin: string;
  bankName: string;
  accountNo: string;
  accountName: string;
};

export type InvitationData = {
  title: string; // "Khang & Diệu Anh"
  guest: { code: string; name: string } | null;
  groom: Person;
  bride: Person;
  ceremony: { time: string; weekday: string; date: string; lunar: string; place: string };
  party: {
    iso: string;
    receptionTime: string;
    partyTime: string;
    weekday: string;
    date: string;
    lunar: string;
    venueName: string;
    venueAddress: string;
    mapUrl: string | null; // link chia sẻ Google Maps
    mapQuery: string | null; // vị trí đọc từ mapUrl
    googleCalendarUrl: string;
    icsUrl: string;
  };
  calendar: { year: number; month: number; day: number };
  dressCode: { note: string | null; colors: string[] } | null; // null = đã tắt trong trang quản trị
  schedule: { time: string; title: string }[];
  gifts: GiftAccount[];
  qrNote: string;
  musicUrl: string | null;
  coverUrl: string | null;
  closingMessage: string;
  photos: string[];
  wishes: WishItem[];
};
