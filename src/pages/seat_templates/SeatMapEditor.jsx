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

      // sync form rows/cols
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
    load(); // eslint-disable-next-line
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

  const onRemoveSeat = (seat) => {
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
    if (
      selected &&
      selected.pos_row === seat.pos_row &&
      selected.pos_col === seat.pos_col
    ) {
      setSelected(null);
      form.resetFields();
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

  const handleSave = async () => {
    try {
      const payload = seats.map((s) => ({
        seat_code: String(s.seat_code).trim(),
        seat_class: String(s.seat_class).toLowerCase(),
        base_price: Number(s.base_price),
        pos_row: Number(s.pos_row),
        pos_col: Number(s.pos_col),
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

      await api.post(
        `/seat-templates/upsert-seats/${id}/seats/upsert`,
        payload
      );
      message.success("Saved seats");
      await load();
    } catch (e) {
      message.error(e.response?.data?.message || "Save failed");
    }
  };

  const handleSaveLayout = async (values) => {
    try {
      await api.patch(`/seat-templates/${id}`, values);
      message.success("Layout updated");
      await load();
    } catch (e) {
      message.error(e.response?.data?.message || "Update failed");
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
                    onRemoveSeat(seat);
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
      {/* Seat map + legend */}
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
            <Button type="primary" onClick={handleSave}>
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

      {/* Form chỉnh rows/cols */}
      <Card title="Template Layout" style={{ minWidth: 260 }}>
        <Form
          form={layoutForm}
          layout="vertical"
          initialValues={{
            rows: tpl?.meta_json?.rows,
            cols: tpl?.meta_json?.cols,
          }}
          onFinish={handleSaveLayout}
        >
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

      {/* Panel chi tiết ghế */}
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
              onClick={handleSave}
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
