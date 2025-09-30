// src/pages/seat_templates/SeatMapEditor.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  message,
  Typography,
  Popconfirm,
} from "antd";
import api from "../../api/axios";

const CELL = 40;
const { Text } = Typography;

export default function SeatMapEditor() {
  const { id } = useParams(); // template_id
  const [tpl, setTpl] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [layoutForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/seat-templates/${id}/seats`);
      setTpl(data.template);
      setSeats(data.seats || []);
      setSelected(null);
      form.resetFields();
      const r = Number(data?.template?.meta_json?.rows || 0);
      const c = Number(data?.template?.meta_json?.cols || 0);
      layoutForm.setFieldsValue({ rows: r, cols: c });
    } catch (e) {
      message.error(e.response?.data?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [id]);

  const rows = Number(tpl?.meta_json?.rows || 0);
  const cols = Number(tpl?.meta_json?.cols || 0);

  const seatByKey = useMemo(() => {
    const m = new Map();
    for (const s of seats) {
      if (s.pos_row != null && s.pos_col != null) {
        m.set(`${s.pos_row}-${s.pos_col}`, s);
      }
    }
    return m;
  }, [seats]);

  const onCellClick = (r, c) => {
    const key = `${r}-${c}`;
    const exist = seatByKey.get(key);
    if (exist) {
      setSelected(exist);
      form.setFieldsValue({
        id: exist.id,
        seat_code: exist.seat_code,
        seat_class: exist.seat_class,
        base_price: Number(exist.base_price),
        pos_row: exist.pos_row,
        pos_col: exist.pos_col,
      });
    } else {
      const newSeat = {
        seat_code: `S${r}${c}`,
        seat_class: "standard",
        base_price: 300000,
        pos_row: r,
        pos_col: c,
        _new: true,
      };
      setSeats((prev) => [...prev, newSeat]);
      setSelected(newSeat);
      form.setFieldsValue(newSeat);
    }
  };

  const handleDeleteSeat = async (seat) => {
    try {
      if (!seat?.id) {
        // nếu ghế mới chưa lưu DB → xoá khỏi state thôi
        setSeats((prev) =>
          prev.filter(
            (s) =>
              !(
                s.pos_row === seat.pos_row &&
                s.pos_col === seat.pos_col &&
                s.seat_code === seat.seat_code
              )
          )
        );
        if (selected?.seat_code === seat.seat_code) {
          setSelected(null);
          form.resetFields();
        }
        return;
      }
      await api.post(`/seat-templates/${id}/seats/${seat.id}`);
      message.success("Seat deleted");
      await load();
    } catch (error) {
      message.error(error.response?.data?.message || "Delete failed");
    }
  };

  const onFieldsChange = () => {
    const v = form.getFieldsValue();
    setSeats((prev) =>
      prev.map((s) => {
        if (s === selected)
          return { ...s, ...v, base_price: Number(v.base_price) };
        if (
          selected &&
          s.pos_row === selected.pos_row &&
          s.pos_col === selected.pos_col &&
          s.seat_code === selected.seat_code
        ) {
          return { ...s, ...v, base_price: Number(v.base_price) };
        }
        return s;
      })
    );
  };

  const handleSaveAll = async () => {
    try {
      const payload = seats.map((s) => ({
        seat_code: String(s.seat_code).trim(),
        seat_class: String(s.seat_class || "standard").toLowerCase(),
        base_price: Number(s.base_price),
        pos_row: Number(s.pos_row),
        pos_col: Number(s.pos_col),
        id: s.id ?? undefined,
      }));
      for (const r of payload) {
        if (
          !r.seat_code ||
          r.pos_row == null ||
          r.pos_col == null ||
          r.base_price == null ||
          !r.seat_class
        ) {
          return message.error(
            "Each seat requires seat_code, seat_class, base_price, pos_row, pos_col"
          );
        }
      }
      await api.post(`/seat-templates/${id}/seats`, payload);
      message.success("Saved seats");
      await load();
    } catch (e) {
      message.error(e.response?.data?.message || "Save failed");
    }
  };

  const handleSaveLayout = async (values) => {
    try {
      await api.patch(`/seat-templates/${id}`, {
        meta_json: { rows: values.rows, cols: values.cols },
      });
      message.success("Layout updated");
      await load();
    } catch (e) {
      message.error(e.response?.data?.message || "Update failed");
    }
  };

  const handleUpdateSeat = async () => {
    try {
      const v = form.getFieldsValue();
      if (!selected?.id) {
        return message.warning(
          "Seat chưa tồn tại trong DB. Hãy dùng Save All để tạo mới trước."
        );
      }
      await api.patch(`/seat-templates/${id}/seats/${selected.id}`, {
        seat_code: v.seat_code,
        seat_class: v.seat_class,
        base_price: Number(v.base_price),
        pos_row: Number(v.pos_row),
        pos_col: Number(v.pos_col),
      });
      message.success("Seat updated");
      await load();
    } catch (error) {
      message.error(error.response?.data?.message || "Update failed");
    }
  };

  const Grid = () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
        gridTemplateRows: `repeat(${rows}, ${CELL}px)`,
        gap: 6,
        padding: 8,
        background: "#fafafa",
        border: "1px solid #eee",
        borderRadius: 8,
        width: cols * (CELL + 6) + 16,
      }}
    >
      {Array.from({ length: rows }, (_, ri) =>
        Array.from({ length: cols }, (_, ci) => {
          const r = ri + 1;
          const c = ci + 1;
          const seat = seatByKey.get(`${r}-${c}`);
          const isSelected =
            selected &&
            seat &&
            selected.pos_row === seat.pos_row &&
            selected.pos_col === seat.pos_col &&
            selected.seat_code === seat.seat_code;

          return (
            <div
              key={`${r}-${c}`}
              onClick={() => onCellClick(r, c)}
              style={{
                width: CELL,
                height: CELL,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                userSelect: "none",
                border: seat
                  ? isSelected
                    ? "2px solid #1677ff"
                    : "1px solid #aaa"
                  : "1px dashed #ccc",
                background: seat
                  ? seat.seat_class === "vip"
                    ? "#fff1f0"
                    : "#f6ffed"
                  : "transparent",
                position: "relative",
              }}
              title={
                seat
                  ? `${seat.seat_code} • ${seat.seat_class} • ${seat.base_price}`
                  : "Empty"
              }
            >
              {seat ? (
                <div
                  style={{ fontSize: 12, textAlign: "center", lineHeight: 1.1 }}
                >
                  <div style={{ fontWeight: 600 }}>{seat.seat_code}</div>
                  <div style={{ fontSize: 11 }}>{seat.base_price}</div>
                </div>
              ) : (
                <Text type="secondary" style={{ fontSize: 10 }}>
                  +
                </Text>
              )}

              {seat && (
                <Popconfirm
                  title="Remove this seat?"
                  onConfirm={(e) => {
                    e?.stopPropagation?.();
                    handleDeleteSeat(seat);
                  }}
                  onCancel={(e) => e?.stopPropagation?.()}
                >
                  <Button
                    size="small"
                    type="text"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      right: -8,
                      top: -10,
                      fontSize: 10,
                    }}
                  >
                    ×
                  </Button>
                </Popconfirm>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <Space align="start" size={24} wrap>
      <Card
        title={
          <Space>
            <span>Seat Map</span>
            <Text type="secondary">
              {tpl?.name} — {rows}x{cols}
            </Text>
          </Space>
        }
        loading={loading}
        extra={
          <Space>
            <Button onClick={load}>Reload</Button>
            <Button type="primary" onClick={handleSaveAll}>
              Save
            </Button>
          </Space>
        }
      >
        {rows && cols ? (
          <>
            <Grid />
            <Divider />
            <Space style={{ fontSize: 12 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  background: "#fff1f0",
                  border: "1px solid #aaa",
                  borderRadius: 4,
                }}
              />
              VIP
              <div
                style={{
                  width: 14,
                  height: 14,
                  background: "#f6ffed",
                  border: "1px solid #aaa",
                  borderRadius: 4,
                }}
              />
              Standard
              <div
                style={{
                  width: 14,
                  height: 14,
                  border: "1px dashed #ccc",
                  borderRadius: 4,
                }}
              />
              Empty (click to add)
            </Space>
          </>
        ) : (
          <Text type="secondary">
            Template này chưa có <code>meta_json.rows/cols</code>. Vui lòng cập
            nhật trước khi vẽ seat map.
          </Text>
        )}
      </Card>

      <Card title="Template Layout" style={{ minWidth: 260 }}>
        <Form form={layoutForm} layout="vertical" onFinish={handleSaveLayout}>
          <Form.Item
            name="rows"
            label="Rows"
            rules={[{ required: true, message: "Rows required" }]}
          >
            <InputNumber min={1} max={100} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="cols"
            label="Cols"
            rules={[{ required: true, message: "Cols required" }]}
          >
            <InputNumber min={1} max={100} style={{ width: "100%" }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Save Layout
          </Button>
        </Form>
      </Card>

      <Card title="Seat Details" style={{ minWidth: 360 }}>
        <Form
          layout="vertical"
          form={form}
          onValuesChange={onFieldsChange}
          disabled={!selected}
          initialValues={{ seat_class: "standard", base_price: 300000 }}
        >
          <Form.Item name="id" label="ID">
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="seat_code"
            label="Seat code"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g. A1" />
          </Form.Item>
          <Form.Item
            name="seat_class"
            label="Class"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: "VIP", value: "vip" },
                { label: "Standard", value: "standard" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="base_price"
            label="Base price"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Space>
            <Form.Item name="pos_row" label="Row" rules={[{ required: true }]}>
              <InputNumber min={1} max={rows || 999} />
            </Form.Item>
            <Form.Item name="pos_col" label="Col" rules={[{ required: true }]}>
              <InputNumber min={1} max={cols || 999} />
            </Form.Item>
          </Space>
          <Divider />
          <Space>
            <Button
              onClick={() => {
                form.resetFields();
                setSelected(null);
              }}
            >
              Clear
            </Button>
            <Button
              type="primary"
              onClick={handleUpdateSeat}
              disabled={!selected?.id}
            >
              Save Seat
            </Button>
            <Button
              type="primary"
              onClick={handleSaveAll}
              disabled={!seats.length}
            >
              Save All
            </Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
}
