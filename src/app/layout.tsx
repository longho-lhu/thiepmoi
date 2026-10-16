import type { Metadata, Viewport } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { Be_Vietnam_Pro, Playfair_Display, Dancing_Script } from 'next/font/google';
import './globals.css';

const body = Be_Vietnam_Pro({ subsets: ['vietnamese'], weight: ['400', '500', '600'], variable: '--font-body' });
const serif = Playfair_Display({ subsets: ['vietnamese'], variable: '--font-serif' });
const script = Dancing_Script({ subsets: ['vietnamese'], variable: '--font-script' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#9e1b1f', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${body.variable} ${serif.variable} ${script.variable}`}>
      <body>
        <AntdRegistry>
          <ConfigProvider
            locale={viVN}
            theme={{ token: { colorPrimary: '#9e1b1f', fontFamily: 'var(--font-body)', borderRadius: 8 } }}
          >
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
