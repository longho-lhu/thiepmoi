'use client';
import { useCallback, useEffect, useState } from 'react';
import { App, Button, Card, Popconfirm, Switch, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '@/lib/api';

type Wish = { id: number; name: string; content: string; approved: boolean; createdAt: string };

export default function WishesPage() {
  const { message } = App.useApp();
  const [rows, setRows] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api<Wish[]>('/api/admin/wishes'));
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (w: Wish, approved: boolean) => {
    setRows((rs) => rs.map((r) => (r.id === w.id ? { ...r, approved } : r)));
    try {
      await api('/api/admin/wishes', { method: 'PATCH', json: { id: w.id, approved } });
      message.success(approved ? 'Đã hiện lời chúc' : 'Đã ẩn lời chúc');
    } catch (e) {
      message.error((e as Error).message);
      load();
    }
  };

  const columns: ColumnsType<Wish> = [
    { title: 'Người gửi', dataIndex: 'name', width: 180 },
    { title: 'Lời chúc', dataIndex: 'content', render: (c: string) => <span style={{ whiteSpace: 'pre-line' }}>{c}</span> },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      width: 130,
      responsive: ['md'],
      render: (d: string) => dayjs(d).format('DD/MM HH:mm'),
    },
    {
      title: 'Hiển thị',
      dataIndex: 'approved',
      width: 90,
      filters: [{ text: 'Đang hiện', value: true }, { text: 'Đã ẩn', value: false }],
      onFilter: (v, r) => r.approved === v,
      render: (a: boolean, w) => <Switch checked={a} onChange={(v) => toggle(w, v)} />,
    },
    {
      title: '',
      key: 'del',
      width: 50,
      render: (_, w) => (
        <Popconfirm
          title="Xoá vĩnh viễn lời chúc này?"
          onConfirm={async () => {
            await api(`/api/admin/wishes?id=${w.id}`, { method: 'DELETE' });
            message.success('Đã xoá');
            load();
          }}
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card title={`Lời chúc (${rows.length})`}>
      <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} scroll={{ x: 600 }} pagination={{ pageSize: 50, hideOnSinglePage: true }} />
    </Card>
  );
}
