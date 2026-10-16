'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { App, Button, Layout, Menu, Space, Typography } from 'antd';
import {
  CheckSquareOutlined,
  DashboardOutlined,
  EyeOutlined,
  HeartOutlined,
  LogoutOutlined,
  MessageOutlined,
  PictureOutlined,
  TeamOutlined,
} from '@ant-design/icons';

const { Sider, Header, Content } = Layout;

const ITEMS = [
  { key: '/admin', icon: <DashboardOutlined />, label: 'Tổng quan' },
  { key: '/admin/wedding', icon: <HeartOutlined />, label: 'Thông tin cưới' },
  { key: '/admin/guests', icon: <TeamOutlined />, label: 'Khách mời' },
  { key: '/admin/rsvps', icon: <CheckSquareOutlined />, label: 'Xác nhận tham dự' },
  { key: '/admin/wishes', icon: <MessageOutlined />, label: 'Lời chúc' },
  { key: '/admin/photos', icon: <PictureOutlined />, label: 'Album ảnh' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const selected = ITEMS.slice().reverse().find((i) => pathname === i.key || pathname.startsWith(i.key + '/'))?.key ?? '/admin';

  const logout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.replace('/admin/login');
  };

  return (
    <App>
      <Layout style={{ minHeight: '100dvh' }}>
        <Sider
          breakpoint="lg"
          collapsedWidth={0}
          collapsed={collapsed}
          onCollapse={setCollapsed}
          onBreakpoint={setIsMobile}
          theme="light"
          width={220}
          style={{ borderRight: '1px solid #f0f0f0', zIndex: 20, ...(isMobile ? { position: 'fixed', height: '100dvh' } : {}) }}
        >
          <div style={{ padding: '18px 20px', fontWeight: 600, fontSize: 16, color: '#9e1b1f' }}>囍 Thiệp cưới</div>
          <Menu
            mode="inline"
            selectedKeys={[selected]}
            items={ITEMS.map((i) => ({ ...i, label: <Link href={i.key}>{i.label}</Link> }))}
            onClick={() => isMobile && setCollapsed(true)}
            style={{ borderInlineEnd: 0 }}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              // chừa chỗ cho nút mở menu của Sider khi thu gọn trên điện thoại
              background: '#fff', padding: isMobile ? '0 12px 0 56px' : '0 16px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Typography.Text strong>{ITEMS.find((i) => i.key === selected)?.label}</Typography.Text>
            <Space>
              <Button icon={<EyeOutlined />} href="/" target="_blank">Xem thiệp</Button>
              <Button icon={<LogoutOutlined />} onClick={logout}>Thoát</Button>
            </Space>
          </Header>
          <Content style={{ padding: 16, maxWidth: 1200, width: '100%', margin: '0 auto' }}>{children}</Content>
        </Layout>
      </Layout>
    </App>
  );
}
