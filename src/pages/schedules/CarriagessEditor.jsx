// src/pages/schedules/CarriagesEditor.jsx
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../api/axios";

const { Text } = Typography;

export default function CarriagesEditor({ value = [], onChange }) {
  const [rows, setRows] = useState(value || []);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  // load seat-templates để hiển thị select
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/seat-templates"); // baseURL: '/api'
        const items = data?.items ?? data ?? [];
        setTemplates(
          items.map((t) => ({ value: t.id, label: t.name || `#${t.id}` }))
        );
      } catch {
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // sync từ ngoài vào (edit form mở lại)
  useEffect(() => {
    setRows(value || []);
  }, [value]);

  const update = (next) => {
    setRows(next);
    onChange?.(next);
  };

  const addRow = () =>
    update([
      ...(rows || []),
      { seat_template_id: undefined, carriage_no: undefined, name: "" },
    ]);
  const removeRow = (idx) => update(rows.filter((_, i) => i !== idx));
  const changeCell = (idx, patch) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    update(next);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={8}>
      <Space align="baseline">
        {/* <Text strong>Carriages</Text> */}
        <Button icon={<PlusOutlined />} onClick={addRow}>
          Add carriage
        </Button>
      </Space>

      {(rows?.length || 0) === 0 ? (
        <Card size="small">
          No carriages. Click <Text strong>Add carriage</Text> to begin.
        </Card>
      ) : (
        rows.map((r, idx) => (
          <Card
            size="small"
            key={idx}
            title={`Carriage #${idx + 1}`}
            extra={
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => removeRow(idx)}
              />
            }
          >
            <Row gutter={[12, 12]}>
              <Col xs={24} md={10}>
                <Text type="secondary">Seat template</Text>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Select seat template"
                  options={templates}
                  loading={loading}
                  value={r.seat_template_id}
                  onChange={(v) => changeCell(idx, { seat_template_id: v })}
                  showSearch
                  optionFilterProp="label"
                />
              </Col>
              <Col xs={12} md={6}>
                <Text type="secondary">Carriage No</Text>
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  value={r.carriage_no}
                  onChange={(v) => changeCell(idx, { carriage_no: v })}
                  placeholder="e.g. 1"
                />
              </Col>
              <Col xs={24} md={8}>
                <Text type="secondary">Name</Text>
                <Input
                  value={r.name}
                  onChange={(e) => changeCell(idx, { name: e.target.value })}
                  placeholder="e.g. Coach 40"
                />
              </Col>
            </Row>
          </Card>
        ))
      )}
    </Space>
  );
}
