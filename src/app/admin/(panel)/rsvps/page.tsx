'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Button, Card, Col, Popconfirm, Row, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api, SIDE_COLOR, SIDE_LABEL } from '@/lib/api';

type Rsvp = {
  id: number;
  name: string;
  phone: string | null;
  attending: boolean;
  headcount: number;
  note: string | null;
  createdAt: string;
  guest: { displayName: string; side: string; code: string } | null;
};

const sideOf = (r: Rsvp) => r.guest?.side ?? 'chung';

function exportCsv(rows: Rsvp[]) {
  const head = ['Tên', 'Khách mời', 'Bên', 'Tham dự', 'Số người', 'Điện thoại', 'Ghi chú', 'Thời gian'];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.name, r.guest?.displayName, SIDE_LABEL[sideOf(r)], r.attending ? 'Có' : 'Không',
      r.attending ? r.headcount : 0, r.phone, r.note, dayjs(r.createdAt).format('DD/MM/YYYY HH:mm'),
    ].map(esc).join(','),
  );
  // BOM để Excel đọc đúng tiếng Việt
  const blob = new Blob(['﻿' + [head.map(esc).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rsvp-${dayjs().format('YYYY-MM-DD')}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function RsvpsPage() {
  const { message } = App.useApp();
  const [rows, setRows] = useState<Rsvp[]>([]);
  const [shown, setShown] = useState<Rsvp[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<Rsvp[]>('/api/admin/rsvps');
      setRows(data);
      setShown(null);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const current = shown ?? rows;
  const totals = useMemo(() => {
    const yes = current.filter((r) => r.attending);
    return { yes: yes.length, no: current.length - yes.length, people: yes.reduce((s, r) => s + r.headcount, 0) };
  }, [current]);

  const columns: ColumnsType<Rsvp> = [
    { title: 'Tên', dataIndex: 'name' },
    { title: 'Khách mời', render: (_, r) => r.guest?.displayName ?? <i style={{ color: '#999' }}>Thiệp chung</i>, responsive: ['md'] },
    {
      title: 'Bên',
      key: 'side',
      width: 110,
      filters: Object.entries(SIDE_LABEL).map(([value, text]) => ({ text, value })),
      onFilter: (v, r) => sideOf(r) === v,
      render: (_, r) => <Tag color={SIDE_COLOR[sideOf(r)]}>{SIDE_LABEL[sideOf(r)]}</Tag>,
    },
    {
      title: 'Tham dự',
      dataIndex: 'attending',
      width: 110,
      filters: [{ text: 'Có', value: true }, { text: 'Không', value: false }],
      onFilter: (v, r) => r.attending === v,
      render: (a: boolean) => (a ? <Tag color="green">Có</Tag> : <Tag color="red">Không</Tag>),
    },
    { title: 'Số người', dataIndex: 'headcount', width: 90, align: 'center', render: (n: number, r) => (r.attending ? n : '—') },
    { title: 'Điện thoại', dataIndex: 'phone', responsive: ['lg'] },
    { title: 'Ghi chú', dataIndex: 'note', ellipsis: true, responsive: ['lg'] },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      width: 140,
      sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
      render: (d: string) => dayjs(d).format('DD/MM HH:mm'),
    },
    {
      title: '',
      key: 'del',
      width: 50,
      render: (_, r) => (
        <Popconfirm
          title="Xoá phản hồi này?"
          onConfirm={async () => {
            await api(`/api/admin/rsvps?id=${r.id}`, { method: 'DELETE' });
            load();
          }}
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={8}><Card><Statistic title="Sẽ dự" value={totals.yes} valueStyle={{ color: '#389e0d' }} /></Card></Col>
        <Col xs={8}><Card><Statistic title="Tổng số người" value={totals.people} valueStyle={{ color: '#9e1b1f' }} /></Card></Col>
        <Col xs={8}><Card><Statistic title="Không dự" value={totals.no} /></Card></Col>
      </Row>
      <Card
        title={`Phản hồi (${current.length})`}
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={load} style={{ marginRight: 8 }} />
            <Button icon={<DownloadOutlined />} onClick={() => exportCsv(current)}>Xuất CSV</Button>
          </>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          scroll={{ x: 700 }}
          pagination={{ pageSize: 50, hideOnSinglePage: true }}
          onChange={(_, __, ___, extra) => setShown(extra.currentDataSource)}
        />
      </Card>
    </>
  );
}
