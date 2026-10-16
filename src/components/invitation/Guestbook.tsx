'use client';
import { useState } from 'react';
import { Button, Empty, Form, Input, message } from 'antd';
import type { WishItem } from './types';
import Section from './Section';
import Deco from './Deco';
import styles from './invitation.module.css';

type Values = { name: string; content: string };

export default function Guestbook({ initial, guestName }: { initial: WishItem[]; guestName?: string }) {
  const [wishes, setWishes] = useState(initial);
  const [sending, setSending] = useState(false);
  const [form] = Form.useForm<Values>();
  const [msg, ctx] = message.useMessage();

  const submit = async (v: Values) => {
    setSending(true);
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Không gửi được, vui lòng thử lại');
      setWishes((w) => [{ ...json, createdAt: json.createdAt }, ...w]);
      form.setFieldValue('content', '');
      msg.success('Cảm ơn lời chúc của bạn!');
    } catch (e) {
      msg.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Section
      eyebrow="Gửi lời yêu thương"
      title="Sổ lưu bút"
      alt
      deco={<Deco name="hoa" className={`${styles.deco} ${styles.branchTopRight}`} sizes="170px" />}
    >
      {ctx}
      <div className={styles.guestbookForm}>
        <Form form={form} layout="vertical" onFinish={submit} initialValues={{ name: guestName ?? '' }} requiredMark={false}>
          <Form.Item name="name" label="Tên của bạn" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên' }]}>
            <Input maxLength={60} />
          </Form.Item>
          <Form.Item name="content" label="Lời chúc" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập lời chúc' }]}>
            <Input.TextArea maxLength={500} showCount rows={3} placeholder="Chúc hai bạn trăm năm hạnh phúc..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={sending}>
            Gửi lời chúc
          </Button>
        </Form>
      </div>

      {wishes.length === 0 ? (
        <Empty description="Hãy là người đầu tiên gửi lời chúc" />
      ) : (
        <div className={styles.wishes}>
          {wishes.map((w) => (
            <div key={w.id} className={styles.wish}>
              <b>{w.name}</b>
              <p>{w.content}</p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
