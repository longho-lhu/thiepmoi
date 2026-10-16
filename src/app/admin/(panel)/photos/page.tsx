'use client';
import { useCallback, useEffect, useState } from 'react';
import { App, Button, Card, Empty, Image, InputNumber, Popconfirm, Space, Spin, Upload } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';
import { mediaUrl } from '@/lib/format';

type Photo = { id: number; file: string; sortOrder: number };

export default function PhotosPage() {
  const { message } = App.useApp();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(0);

  const load = useCallback(async () => {
    try {
      setPhotos(await api<Photo[]>('/api/admin/photos'));
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const setOrder = async (p: Photo, sortOrder: number | null) => {
    if (sortOrder === null || sortOrder === p.sortOrder) return;
    await api('/api/admin/photos', { method: 'PATCH', json: { id: p.id, sortOrder } });
    load();
  };

  return (
    <Card title={`Album ảnh (${photos.length})`} extra={<span style={{ color: '#888' }}>Thiệp hiện 4 ảnh đầu, số nhỏ xếp trước</span>}>
      <Upload
        listType="picture-card"
        accept="image/*"
        multiple
        showUploadList={false}
        customRequest={async ({ file, onSuccess, onError }) => {
          setUploading((n) => n + 1);
          const fd = new FormData();
          fd.append('file', file as File);
          try {
            await api('/api/admin/photos', { method: 'POST', body: fd });
            onSuccess?.({});
            load();
          } catch (e) {
            message.error((e as Error).message);
            onError?.(e as Error);
          } finally {
            setUploading((n) => n - 1);
          }
        }}
      >
        {uploading > 0 ? (
          <Spin tip={`Đang tải ${uploading}`}><div style={{ width: 60, height: 40 }} /></Spin>
        ) : (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Thêm ảnh</div>
          </div>
        )}
      </Upload>

      {loading ? (
        <Spin />
      ) : photos.length === 0 ? (
        <Empty description="Chưa có ảnh" />
      ) : (
        <Image.PreviewGroup>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginTop: 16 }}>
            {photos.map((p) => (
              <Card
                key={p.id}
                size="small"
                styles={{ body: { padding: 8 } }}
                cover={<Image src={mediaUrl(p.file)} alt="" height={200} style={{ objectFit: 'cover' }} />}
              >
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <InputNumber
                    size="small"
                    min={0}
                    max={9999}
                    defaultValue={p.sortOrder}
                    onBlur={(e) => setOrder(p, Number(e.target.value))}
                    onPressEnter={(e) => setOrder(p, Number((e.target as HTMLInputElement).value))}
                    style={{ width: 80 }}
                    addonBefore="#"
                  />
                  <Popconfirm
                    title="Xoá ảnh này?"
                    onConfirm={async () => {
                      await api(`/api/admin/photos?id=${p.id}`, { method: 'DELETE' });
                      load();
                    }}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </Card>
            ))}
          </div>
        </Image.PreviewGroup>
      )}
    </Card>
  );
}
