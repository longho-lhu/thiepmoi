'use client';
import { useState } from 'react';
import { Alert, Button, Form, Input, InputNumber, Modal, Radio, Result } from 'antd';

type Props = {
  open: boolean;
  onClose: () => void;
  guest: { code: string; name: string } | null;
};

type Values = { name: string; phone?: string; attending: boolean; headcount?: number; note?: string };

export default function RsvpModal({ open, onClose, guest }: Props) {
  const [form] = Form.useForm<Values>();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | boolean>(null); // null = chưa gửi, true/false = dự hay không
  const attending = Form.useWatch('attending', form);

  const submit = async (v: Values) => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestCode: guest?.code,
          name: v.name,
          phone: v.phone || undefined,
          attending: v.attending,
          headcount: v.attending ? (v.headcount ?? 1) : 1,
          note: v.note || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Không gửi được, vui lòng thử lại');
      setDone(v.attending);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={done === null ? 'Xác nhận tham dự' : null}
      destroyOnHidden
      afterClose={() => setDone(null)}
      centered
    >
      {done !== null ? (
        <Result
          status="success"
          title="Cảm ơn bạn đã phản hồi!"
          subTitle={
            done
              ? 'Gia đình rất mong được gặp bạn trong ngày vui.'
              : 'Tiếc quá! Cảm ơn bạn đã báo cho chúng tôi biết.'
          }
          extra={<Button type="primary" onClick={onClose}>Đóng</Button>}
        />
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={submit}
          initialValues={{ name: guest?.name ?? '', attending: true, headcount: 1 }}
          requiredMark={false}
        >
          <Form.Item name="name" label="Tên của bạn" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên' }]}>
            <Input maxLength={80} placeholder="VD: Gia đình anh Nam" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại (không bắt buộc)">
            <Input maxLength={20} inputMode="tel" />
          </Form.Item>
          <Form.Item name="attending" label="Bạn sẽ đến chứ?">
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: 'Mình sẽ đến', value: true },
                { label: 'Rất tiếc, không đến được', value: false },
              ]}
            />
          </Form.Item>
          {attending !== false && (
            <Form.Item name="headcount" label="Số người tham dự">
              <InputNumber min={1} max={10} style={{ width: 120 }} />
            </Form.Item>
          )}
          <Form.Item name="note" label="Ghi chú (không bắt buộc)">
            <Input.TextArea maxLength={300} rows={2} placeholder="VD: có 1 bé ăn chay" />
          </Form.Item>
          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
          <Button type="primary" htmlType="submit" block size="large" loading={sending}>
            Gửi xác nhận
          </Button>
        </Form>
      )}
    </Modal>
  );
}
