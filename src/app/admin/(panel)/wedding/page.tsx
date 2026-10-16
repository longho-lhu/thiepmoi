'use client';
import { useCallback, useEffect, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  App, Button, Card, Col, ColorPicker, DatePicker, Form, Input, Popconfirm, Row, Select, Skeleton, Space, Switch, Typography, Upload,
} from 'antd';
import { DeleteOutlined, MinusCircleOutlined, PlusOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';
import { mediaUrl } from '@/lib/format';

// Mã BIN một số ngân hàng phổ biến (dùng cho VietQR)
const BANKS = [
  ['970436', 'Vietcombank'], ['970415', 'VietinBank'], ['970418', 'BIDV'], ['970405', 'Agribank'],
  ['970407', 'Techcombank'], ['970422', 'MB Bank'], ['970416', 'ACB'], ['970432', 'VPBank'],
  ['970423', 'TPBank'], ['970403', 'Sacombank'], ['970441', 'VIB'], ['970443', 'SHB'],
  ['970437', 'HDBank'], ['970448', 'OCB'], ['970426', 'MSB'], ['970440', 'SeABank'],
  ['970431', 'Eximbank'], ['970449', 'LPBank'], ['970428', 'Nam A Bank'], ['970454', 'BVBank (Timo)'],
].map(([value, name]) => ({ value, label: `${name} (${value})`, name }));

type Wedding = Record<string, unknown> & {
  ceremonyAt: string; receptionAt: string; partyAt: string;
  coverImage: string | null; musicFile: string | null;
  mapUrl: string | null; mapQuery: string | null;
};

const DATE_FIELDS = ['ceremonyAt', 'receptionAt', 'partyAt'] as const;

function BankFields({ prefix, title }: { prefix: 'groom' | 'bride'; title: string }) {
  const form = Form.useFormInstance();
  return (
    <Col xs={24} md={12}>
      <Card size="small" title={title} type="inner">
        <Form.Item name={`${prefix}BankBin`} label="Ngân hàng">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            options={BANKS}
            placeholder="Chọn ngân hàng"
            onChange={(_, opt) => {
              const o = Array.isArray(opt) ? opt[0] : opt;
              if (o) form.setFieldValue(`${prefix}BankName`, (o as { name: string }).name);
            }}
          />
        </Form.Item>
        <Form.Item name={`${prefix}BankName`} label="Tên ngân hàng hiển thị">
          <Input maxLength={80} />
        </Form.Item>
        <Form.Item name={`${prefix}AccountNo`} label="Số tài khoản">
          <Input maxLength={30} inputMode="numeric" />
        </Form.Item>
        <Form.Item name={`${prefix}AccountName`} label="Chủ tài khoản">
          <Input maxLength={80} placeholder="NGUYEN MINH KHANG" />
        </Form.Item>
      </Card>
    </Col>
  );
}

function MediaUpload({ kind, current, onChanged }: { kind: 'cover' | 'music'; current: string | null; onChanged: () => void }) {
  const { message } = App.useApp();
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {current && kind === 'cover' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl(current)} alt="Ảnh bìa" style={{ maxWidth: 200, borderRadius: 8, display: 'block' }} />
      )}
      {current && kind === 'music' && <audio src={mediaUrl(current)} controls style={{ width: '100%', maxWidth: 360 }} />}
      <Space wrap>
        <Upload
          accept={kind === 'cover' ? 'image/*' : '.mp3,.m4a,audio/mpeg,audio/mp4'}
          showUploadList={false}
          customRequest={async ({ file, onSuccess, onError }) => {
            const fd = new FormData();
            fd.append('kind', kind);
            fd.append('file', file as File);
            try {
              await api('/api/admin/media', { method: 'POST', body: fd });
              message.success('Đã tải lên');
              onSuccess?.({});
              onChanged();
            } catch (e) {
              message.error((e as Error).message);
              onError?.(e as Error);
            }
          }}
        >
          <Button icon={<UploadOutlined />}>{current ? 'Thay file' : 'Tải lên'}</Button>
        </Upload>
        {current && (
          <Popconfirm
            title="Xoá file này?"
            onConfirm={async () => {
              await api(`/api/admin/media?kind=${kind}`, { method: 'DELETE' });
              onChanged();
            }}
          >
            <Button danger icon={<DeleteOutlined />}>Xoá</Button>
          </Popconfirm>
        )}
      </Space>
    </Space>
  );
}

export default function WeddingPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [data, setData] = useState<Wedding | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const w = await api<Wedding>('/api/admin/wedding');
      setData(w);
      const values: Record<string, unknown> = { ...w };
      for (const f of DATE_FIELDS) values[f] = dayjs(w[f]);
      form.setFieldsValue(values);
    } catch (e) {
      message.error((e as Error).message);
    }
  }, [form, message]);

  useEffect(() => {
    load();
  }, [load]);

  // Chỉ cập nhật ảnh bìa / nhạc, không ghi đè những gì đang sửa dở trong form
  const refreshMedia = async () => setData(await api<Wedding>('/api/admin/wedding'));

  const save = async (v: Record<string, unknown>) => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...v };
      for (const f of DATE_FIELDS) body[f] = (v[f] as Dayjs).toISOString();
      const r = await api<{ mapQuery: string | null }>('/api/admin/wedding', { method: 'PUT', json: body });
      setData((d) => (d ? { ...d, mapUrl: (v.mapUrl as string) || null, mapQuery: r.mapQuery } : d));
      message.success('Đã lưu thông tin cưới');
      if (v.mapUrl && !r.mapQuery) {
        message.warning('Chưa đọc được vị trí từ link Google Maps. Bản đồ sẽ tạm dùng địa chỉ tổ chức tiệc.');
      }
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <Card><Skeleton active paragraph={{ rows: 10 }} /></Card>;

  const req = [{ required: true, whitespace: true, message: 'Bắt buộc' }];
  const dt = { showTime: { format: 'HH:mm' }, format: 'DD/MM/YYYY HH:mm', style: { width: '100%' } };

  return (
    <Form form={form} layout="vertical" onFinish={save} scrollToFirstError>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={16}>
          {(['groom', 'bride'] as const).map((p) => (
            <Col xs={24} md={12} key={p}>
              <Card title={p === 'groom' ? 'Nhà trai' : 'Nhà gái'} style={{ marginBottom: 16 }}>
                <Form.Item name={`${p}Name`} label={p === 'groom' ? 'Tên chú rể' : 'Tên cô dâu'} rules={req}>
                  <Input maxLength={80} />
                </Form.Item>
                <Form.Item name={`${p}Role`} label="Vai vế" rules={req}>
                  <Input maxLength={40} placeholder={p === 'groom' ? 'Trưởng Nam' : 'Út Nữ'} />
                </Form.Item>
                <Form.Item name={`${p}Father`} label="Bố" rules={req}>
                  <Input maxLength={80} />
                </Form.Item>
                <Form.Item name={`${p}Mother`} label="Mẹ" rules={req}>
                  <Input maxLength={80} />
                </Form.Item>
                <Form.Item name={`${p}Address`} label="Địa chỉ" rules={req}>
                  <Input maxLength={200} />
                </Form.Item>
              </Card>
            </Col>
          ))}
        </Row>

        <Card title="Lễ cưới và tiệc cưới">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="ceremonyAt" label="Giờ làm lễ" rules={[{ required: true }]}>
                <DatePicker {...dt} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="ceremonyPlace" label="Nơi làm lễ" rules={req}>
                <Input maxLength={200} placeholder="Tư gia nhà trai" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="receptionAt" label="Giờ đón khách" rules={[{ required: true }]}>
                <DatePicker {...dt} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="partyAt" label="Giờ khai tiệc" rules={[{ required: true }]}>
                <DatePicker {...dt} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="venueName" label="Tên nhà hàng / địa điểm" rules={req}>
                <Input maxLength={120} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="venueAddress" label="Địa chỉ tổ chức tiệc" rules={req}>
                <Input maxLength={250} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="mapUrl"
                label="Link chia sẻ Google Maps"
                rules={[{ type: 'url', message: 'Dán link dạng https://maps.app.goo.gl/...' }]}
                extra={
                  <>
                    Mở Google Maps → tìm nhà hàng → <b>Chia sẻ</b> → <b>Sao chép đường liên kết</b> rồi dán vào đây.
                    {data.mapUrl
                      ? data.mapQuery
                        ? <> Vị trí đã nhận: <Typography.Text code>{data.mapQuery}</Typography.Text></>
                        : <Typography.Text type="warning"> Chưa đọc được vị trí, bản đồ đang dùng địa chỉ ở trên.</Typography.Text>
                      : ' Để trống thì bản đồ dùng tên và địa chỉ nhà hàng.'}
                  </>
                }
              >
                <Input maxLength={500} placeholder="https://maps.app.goo.gl/..." allowClear />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Card title="Lịch trình buổi tiệc" style={{ marginBottom: 16 }}>
              <Form.List name="schedule">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name }) => (
                      <Space key={key} align="baseline" style={{ display: 'flex' }}>
                        <Form.Item name={[name, 'time']} rules={req}>
                          <Input placeholder="17:30" style={{ width: 80 }} maxLength={10} />
                        </Form.Item>
                        <Form.Item name={[name, 'title']} rules={req} style={{ flex: 1 }}>
                          <Input placeholder="Đón khách" maxLength={100} />
                        </Form.Item>
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      </Space>
                    ))}
                    <Button type="dashed" onClick={() => add({ time: '', title: '' })} icon={<PlusOutlined />} block>
                      Thêm mục
                    </Button>
                  </>
                )}
              </Form.List>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              title="Dress code"
              style={{ marginBottom: 16 }}
              extra={
                <Form.Item name="showDressCode" valuePropName="checked" noStyle>
                  <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
                </Form.Item>
              }
            >
              <Form.Item name="dressCodeNote" label="Ghi chú">
                <Input.TextArea maxLength={300} rows={2} placeholder="Mời bạn diện trang phục tông đỏ – kem" />
              </Form.Item>
              <Form.List name="dressCodeColors">
                {(fields, { add, remove }) => (
                  <Space wrap>
                    {fields.map(({ key, name }) => (
                      <Space key={key} size={4}>
                        <Form.Item name={name} noStyle getValueFromEvent={(c) => c.toHexString()}>
                          <ColorPicker disabledAlpha />
                        </Form.Item>
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      </Space>
                    ))}
                    {fields.length < 8 && (
                      <Button type="dashed" icon={<PlusOutlined />} onClick={() => add('#9e1b1f')}>Thêm màu</Button>
                    )}
                  </Space>
                )}
              </Form.List>
            </Card>
          </Col>
        </Row>

        <Card title="Hộp quà mừng (VietQR)">
          <Row gutter={16}>
            <BankFields prefix="groom" title="Tài khoản chú rể" />
            <BankFields prefix="bride" title="Tài khoản cô dâu" />
          </Row>
        </Card>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Card title="Ảnh bìa" style={{ marginBottom: 16 }}>
              <MediaUpload kind="cover" current={data.coverImage} onChanged={refreshMedia} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Nhạc nền (MP3 128kbps, 2–3 phút)" style={{ marginBottom: 16 }}>
              <MediaUpload kind="music" current={data.musicFile} onChanged={refreshMedia} />
            </Card>
          </Col>
        </Row>

        <Card title="Lời kết">
          <Form.Item name="closingMessage" rules={req} style={{ marginBottom: 0 }}>
            <Input.TextArea maxLength={300} rows={2} />
          </Form.Item>
        </Card>

        <div style={{ position: 'sticky', bottom: 0, padding: '12px 0', background: '#f5f5f5', zIndex: 5 }}>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" loading={saving}>
            Lưu thông tin
          </Button>
        </div>
      </Space>
    </Form>
  );
}
