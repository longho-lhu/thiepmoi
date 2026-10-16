'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App, Button, Card, Form, Input, Modal, Popconfirm, QRCode, Segmented, Select, Space, Table, Tag, Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined, QrcodeOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { api, SIDE_COLOR, SIDE_LABEL, siteUrl } from '@/lib/api';
import { CODE_PATTERN, slugify } from '@/lib/slug';

type Guest = {
  id: number;
  code: string;
  displayName: string;
  side: string;
  note: string | null;
  createdAt: string;
  rsvp: { attending: boolean; headcount: number } | null;
};

const SIDE_OPTIONS = Object.entries(SIDE_LABEL).map(([value, label]) => ({ value, label }));

export default function GuestsPage() {
  const { message } = App.useApp();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Partial<Guest> | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [qrGuest, setQrGuest] = useState<Guest | null>(null);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();

  const link = (code: string) => `${siteUrl()}/k/${code}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setGuests(await api<Guest[]>('/api/admin/guests'));
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? guests.filter((g) => g.displayName.toLowerCase().includes(q) || g.code.includes(q)) : guests;
  }, [guests, search]);

  const openEdit = (g?: Guest) => {
    setEditing(g ?? {});
    form.setFieldsValue(
      g ? { displayName: g.displayName, side: g.side, note: g.note, code: g.code } : { displayName: '', side: 'chung', note: '' },
    );
  };

  const saveOne = async () => {
    const { code, ...v } = await form.validateFields();
    try {
      if (editing?.id) await api('/api/admin/guests', { method: 'PUT', json: { id: editing.id, ...v, code: code || undefined } });
      else await api('/api/admin/guests', { method: 'POST', json: v }); // link tự lấy theo tên
      message.success('Đã lưu');
      setEditing(null);
      load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const saveBulk = async () => {
    const v = await bulkForm.validateFields();
    const names = String(v.names).split('\n').map((s) => s.trim()).filter(Boolean);
    if (names.length === 0) return;
    try {
      const r = await api<{ created: number }>('/api/admin/guests', { method: 'POST', json: { names, side: v.side } });
      message.success(`Đã thêm ${r.created} khách`);
      setBulkOpen(false);
      bulkForm.resetFields();
      load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const remove = async (id: number) => {
    await api(`/api/admin/guests?id=${id}`, { method: 'DELETE' });
    message.success('Đã xoá');
    load();
  };

  const columns: ColumnsType<Guest> = [
    { title: 'Tên hiển thị', dataIndex: 'displayName', sorter: (a, b) => a.displayName.localeCompare(b.displayName, 'vi') },
    {
      title: 'Bên',
      dataIndex: 'side',
      width: 110,
      filters: SIDE_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
      onFilter: (v, r) => r.side === v,
      render: (s: string) => <Tag color={SIDE_COLOR[s]}>{SIDE_LABEL[s] ?? s}</Tag>,
    },
    {
      title: 'Link riêng',
      dataIndex: 'code',
      render: (code: string) => (
        <Typography.Text copyable={{ text: link(code), tooltips: ['Sao chép link', 'Đã sao chép'] }} code>
          /k/{code}
        </Typography.Text>
      ),
    },
    {
      title: 'RSVP',
      dataIndex: 'rsvp',
      width: 130,
      filters: [
        { text: 'Sẽ dự', value: 'yes' },
        { text: 'Không dự', value: 'no' },
        { text: 'Chưa phản hồi', value: 'none' },
      ],
      onFilter: (v, r) => (v === 'none' ? !r.rsvp : r.rsvp?.attending === (v === 'yes')),
      render: (r: Guest['rsvp']) =>
        !r ? <Tag>Chưa phản hồi</Tag> : r.attending ? <Tag color="green">Dự · {r.headcount} người</Tag> : <Tag color="red">Không dự</Tag>,
    },
    { title: 'Ghi chú', dataIndex: 'note', ellipsis: true, responsive: ['md'] },
    {
      title: '',
      key: 'actions',
      width: 130,
      render: (_, g) => (
        <Space size={4}>
          <Button size="small" icon={<QrcodeOutlined />} onClick={() => setQrGuest(g)} title="QR" />
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(g)} title="Sửa" />
          <Popconfirm title="Xoá khách này?" description="Link riêng sẽ không mở được nữa." onConfirm={() => remove(g.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} title="Xoá" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={`Khách mời (${guests.length})`}
      extra={
        <Space wrap>
          <Button icon={<UnorderedListOutlined />} onClick={() => setBulkOpen(true)}>Nhập nhiều</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>Thêm khách</Button>
        </Space>
      }
    >
      <Input.Search placeholder="Tìm theo tên hoặc mã" allowClear onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320, marginBottom: 16 }} />
      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} scroll={{ x: 760 }} pagination={{ pageSize: 50, hideOnSinglePage: true }} />

      <Modal open={!!editing} title={editing?.id ? 'Sửa khách' : 'Thêm khách'} onOk={saveOne} onCancel={() => setEditing(null)} okText="Lưu" destroyOnHidden>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="displayName" label="Tên hiển thị trên thiệp" rules={[{ required: true, whitespace: true, message: 'Nhập tên' }]} extra='VD: "Gia đình em Tính & Tuyết"'>
            <Input maxLength={100} />
          </Form.Item>
          {editing?.id ? (
            <Form.Item label="Link mời" extra="Đổi link thì link cũ đã gửi sẽ không mở được nữa.">
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item
                  name="code"
                  noStyle
                  rules={[
                    { required: true, message: 'Nhập link' },
                    { pattern: CODE_PATTERN, message: 'Chỉ gồm chữ thường không dấu, số và dấu -' },
                  ]}
                  normalize={(v: string) => v.toLowerCase().replace(/\s+/g, '-')}
                >
                  <Input addonBefore="/k/" maxLength={70} />
                </Form.Item>
                <Button onClick={() => form.setFieldValue('code', slugify(form.getFieldValue('displayName') ?? ''))}>
                  Lấy theo tên
                </Button>
              </Space.Compact>
            </Form.Item>
          ) : (
            <Form.Item noStyle shouldUpdate={(a, b) => a.displayName !== b.displayName}>
              {() => (
                <div style={{ marginTop: -16, marginBottom: 16, color: '#888' }}>
                  Link mời: /k/{slugify(form.getFieldValue('displayName') ?? '') || '…'}
                </div>
              )}
            </Form.Item>
          )}
          <Form.Item name="side" label="Khách bên">
            <Segmented options={SIDE_OPTIONS} block />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea maxLength={300} rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal open={bulkOpen} title="Nhập nhiều khách" onOk={saveBulk} onCancel={() => setBulkOpen(false)} okText="Tạo tất cả" destroyOnHidden>
        <Form form={bulkForm} layout="vertical" initialValues={{ side: 'chung' }} requiredMark={false}>
          <Form.Item name="names" label="Mỗi dòng một tên khách" rules={[{ required: true, message: 'Dán danh sách tên' }]}>
            <Input.TextArea rows={10} placeholder={'Gia đình chú Hùng\nAnh Tuấn & chị Mai\nBạn Linh'} />
          </Form.Item>
          <Form.Item name="side" label="Khách bên">
            <Select options={SIDE_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal open={!!qrGuest} title={qrGuest?.displayName} footer={null} onCancel={() => setQrGuest(null)} centered width={340}>
        {qrGuest && (
          <Space direction="vertical" align="center" style={{ width: '100%' }}>
            <QRCode value={link(qrGuest.code)} size={240} color="#7a1215" />
            <Typography.Text copyable>{link(qrGuest.code)}</Typography.Text>
          </Space>
        )}
      </Modal>
    </Card>
  );
}
