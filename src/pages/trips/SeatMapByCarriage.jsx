// src/pages/trips/SeatmapByCarriage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Tabs,
  Card,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  Skeleton,
  Empty,
  Segmented,
  Switch,
  Tooltip,
  Slider,
  Divider,
  Badge,
  Button,
  message,
} from "antd";
import {
  ReloadOutlined,
  AppstoreOutlined,
  BorderlessTableOutlined,
} from "@ant-design/icons";
import api from "../../api/axios";

function normalizeSeat(raw) {
  const row = Number(raw.row ?? raw.pos_row ?? 0);
  const col = Number(raw.col ?? raw.pos_col ?? 0);
  const cls = String(raw.class ?? raw.seat_class ?? "standard").toLowerCase();
  const price = Number(raw.price ?? raw.base_price ?? 0);

  const statusRaw = raw.status ?? raw.state ?? raw.seat_status ?? null;
  const statusStr =
    typeof statusRaw === "string" ? statusRaw.toLowerCase() : null;
  const statusNum =
    typeof statusRaw === "number"
      ? statusRaw
      : typeof raw.status_id === "number"
      ? raw.status_id
      : null;

  const soldHeuristics =
    Boolean(raw.sold) ||
    raw.order_item_id != null ||
    raw.sold_at != null ||
    (statusStr
      ? ["sold", "held", "reserved", "occupied", "unavailable"].includes(
          statusStr
        )
      : false) ||
    (statusNum != null ? Number(statusNum) >= 2 : false);

  const status = statusStr || (soldHeuristics ? "sold" : "available");

  return {
    seat_code: String(raw.seat_code),
    row,
    col,
    class: cls,
    price,
    sold: soldHeuristics,
    status,
    // giữ vài field gốc để debug khi cần
    _raw: raw,
  };
}

function Seat({ seat, size = 42, showLabel = true, compact = false }) {
  const bg = seat.sold
    ? "#fecaca"
    : seat.class === "vip"
    ? "#fde68a"
    : "#bbf7d0";
  const border = seat.sold ? "#ef4444" : "#d4d4d8";
  return (
    <div
      title={`${seat.seat_code} • ${seat.class} • ${seat.status} • ${seat.row}/${seat.col}`}
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        border: `1px solid ${border}`,
        display: "grid",
        placeItems: "center",
        background: bg,
        opacity: seat.sold ? 0.75 : 1,
        fontWeight: 600,
        fontSize: compact ? 12 : 13,
        userSelect: "none",
      }}
    >
      {showLabel ? seat.seat_code : " "}
    </div>
  );
}

/** Lưới cố định rows/cols như SeatMapEditor */
function SeatGrid({
  seats = [],
  rows = 0,
  cols = 0,
  zoom = 42,
  showLabels = true,
  classFilter = "all",
  compact = false,
}) {
  const norm = useMemo(() => seats.map(normalizeSeat), [seats]);
  const filtered = useMemo(
    () =>
      classFilter === "all"
        ? norm
        : norm.filter((s) => s.class === classFilter),
    [norm, classFilter]
  );
  const byKey = useMemo(() => {
    const m = new Map();
    for (const s of filtered)
      if (s.row >= 1 && s.col >= 1) m.set(`${s.row}-${s.col}`, s);
    return m;
  }, [filtered]);
  if (!rows || !cols)
    return <Empty description="Template layout (rows/cols) not set" />;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${zoom}px)`,
        gridTemplateRows: `repeat(${rows}, ${zoom}px)`,
        gap: 8,
      }}
    >
      {Array.from({ length: rows }, (_, ri) =>
        Array.from({ length: cols }, (_, ci) => {
          const r = ri + 1,
            c = ci + 1;
          const seat = byKey.get(`${r}-${c}`);
          return seat ? (
            <Seat
              key={`${r}-${c}`}
              seat={seat}
              size={zoom}
              showLabel={showLabels}
              compact={compact}
            />
          ) : (
            <div
              key={`${r}-${c}`}
              style={{
                width: zoom,
                height: zoom,
                borderRadius: 6,
                border: "1px dashed #d4d4d8",
              }}
            />
          );
        })
      )}
    </div>
  );
}

export default function SeatmapByCarriage() {
  const { id } = useParams(); // trip id
  const [carriages, setCarriages] = useState([]);
  const [activeKey, setActiveKey] = useState();
  const [mergedByCar, setMergedByCar] = useState({}); // { [carId]: mergedSeats[] }
  const [tplMetaByCar, setTplMetaByCar] = useState({}); // { [carId]: { rows, cols } }
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(44);
  const [classFilter, setClassFilter] = useState("all");
  const [showLabels, setShowLabels] = useState(true);
  const [compact, setCompact] = useState(false);

  // 1) Lấy danh sách toa theo trip
  const loadCarriages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`carriages/trips/${id}/carriages`);
      const list = res.data?.carriages || [];
      setCarriages(list);
      if (!activeKey && list[0]?.id) setActiveKey(String(list[0].id));
    } catch (e) {
      message.error(e.response?.data?.message || "Load carriages failed");
    } finally {
      setLoading(false);
    }
  };

  // 2) Ghép TripSeat + TemplateSeat theo seat_code
  const loadCarriageData = async (carriage, force = false) => {
    const key = String(carriage.id);
    if (mergedByCar[key] && tplMetaByCar[key] && !force) return;

    try {
      // gọi song song
      const [tripSeatsRes, tplSeatsRes] = await Promise.all([
        api.get(`/carriages/${key}/seatmap`), // → { seats: tripSeats[] } (có sold/status, KHÔNG có pos?)
        api.get(`/seat-templates/${carriage.seat_template_id}/seats`), // → { template, seats: templateSeats[] } (có pos_row/pos_col)
      ]);

      const tripSeats = Array.isArray(tripSeatsRes.data?.seats)
        ? tripSeatsRes.data.seats
        : [];
      const tpl = tplSeatsRes.data?.template;
      const tmplSeats = Array.isArray(tplSeatsRes.data?.seats)
        ? tplSeatsRes.data.seats
        : [];

      // meta rows/cols từ template
      const rows = Number(tpl?.meta_json?.rows || 0);
      const cols = Number(tpl?.meta_json?.cols || 0);
      setTplMetaByCar((prev) => ({ ...prev, [key]: { rows, cols } }));

      // build map theo seat_code
      const tMap = new Map(tripSeats.map((s) => [String(s.seat_code), s]));
      const merged = tmplSeats.map((ts) => {
        const tsNorm = {
          seat_code: String(ts.seat_code),
          pos_row: Number(ts.pos_row || 0),
          pos_col: Number(ts.pos_col || 0),
          seat_class: (ts.seat_class || "standard").toLowerCase(),
          base_price: Number(ts.base_price || 0),
        };
        const t = tMap.get(tsNorm.seat_code) || {};

        // hợp nhất dữ liệu, nhưng để normalizeSeat() quyết định sold/status
        const rawForNormalize = {
          seat_code: tsNorm.seat_code,
          pos_row: tsNorm.pos_row,
          pos_col: tsNorm.pos_col,
          seat_class: tsNorm.seat_class,
          base_price: tsNorm.base_price,
          // các dấu hiệu sold có thể có từ TripSeat:
          sold: t.sold,
          status: t.status ?? t.state ?? t.seat_status,
          status_id: t.status_id,
          order_item_id: t.order_item_id,
          sold_at: t.sold_at,
          // fallback nếu backend đã cung cấp sẵn class/price cho TripSeat:
          class: t.class,
          price: t.price,
        };

        return rawForNormalize; // sẽ được normalizeSeat() xử lý ở SeatGrid
      });

      setMergedByCar((prev) => ({ ...prev, [key]: merged }));
    } catch (e) {
      message.error(
        e.response?.data?.message || "Load seatmap/template failed"
      );
    }
  };

  useEffect(() => {
    loadCarriages(); /* eslint-disable-next-line */
  }, [id]);

  useEffect(() => {
    if (!activeKey) return;
    const c = carriages.find((x) => String(x.id) === String(activeKey));
    if (c?.seat_template_id) loadCarriageData(c);
    // eslint-disable-next-line
  }, [activeKey, carriages]);

  const totals = useMemo(() => {
    const arr = mergedByCar[String(activeKey)] || [];
    const norm = arr.map(normalizeSeat);
    const sold = norm.filter((s) => s.sold).length;
    const vip = norm.filter((s) => s.class === "vip").length;
    return { total: norm.length, sold, available: norm.length - sold, vip };
  }, [mergedByCar, activeKey]);

  if (loading) return <Skeleton active />;

  const items = carriages.map((c, idx) => {
    const key = String(c.id);
    const meta = tplMetaByCar[key] || { rows: 0, cols: 0 };
    const seats = mergedByCar[key] || [];
    return {
      key,
      label: (
        <Space size={6}>
          {c.name || `Carriage ${idx + 1}`}
          <Badge count={seats.length} style={{ backgroundColor: "#1677ff" }} />
        </Space>
      ),
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={18}>
              <Card
                title={
                  <Space wrap>
                    <span>Seatmap</span>
                    <Tag>Carriage #{c.id}</Tag>
                    <Tag color="blue">
                      Template: {c.seat_template_id ?? "-"}
                    </Tag>
                    <Tag color="purple">
                      {meta.rows}×{meta.cols}
                    </Tag>
                  </Space>
                }
                extra={
                  <Space wrap>
                    <Tooltip title="Reload seatmap">
                      <Button
                        size="small"
                        icon={<ReloadOutlined />}
                        onClick={() => loadCarriageData(c, true)}
                      />
                    </Tooltip>
                    <Segmented
                      size="small"
                      value={classFilter}
                      onChange={setClassFilter}
                      options={[
                        {
                          label: "All",
                          value: "all",
                          icon: <AppstoreOutlined />,
                        },
                        { label: "Standard", value: "standard" },
                        { label: "VIP", value: "vip" },
                      ]}
                    />
                    <Tooltip title="Show labels">
                      <Switch checked={showLabels} onChange={setShowLabels} />
                    </Tooltip>
                    <Tooltip title="Compact mode">
                      <Switch checked={compact} onChange={setCompact} />
                    </Tooltip>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: "100%" }} size={8}>
                  <SeatGrid
                    seats={seats}
                    rows={meta.rows}
                    cols={meta.cols}
                    zoom={zoom}
                    showLabels={showLabels}
                    classFilter={classFilter}
                    compact={compact}
                  />
                  <Divider style={{ margin: "10px 0" }} />
                  <Row align="middle" gutter={[12, 12]}>
                    <Col xs={24} md={12}>
                      <Space>
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            background: "#bbf7d0",
                            border: "1px solid #d4d4d8",
                            borderRadius: 4,
                          }}
                        />
                        <span>Standard</span>
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            background: "#fde68a",
                            border: "1px solid #d4d4d8",
                            borderRadius: 4,
                          }}
                        />
                        <span>VIP</span>
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            background: "#fecaca",
                            border: "1px solid #ef4444",
                            borderRadius: 4,
                          }}
                        />
                        <span>Sold</span>
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            border: "1px dashed #d4d4d8",
                            borderRadius: 4,
                          }}
                        />
                        <span>Empty</span>
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space
                        style={{ width: "100%", justifyContent: "flex-end" }}
                      >
                        <BorderlessTableOutlined />
                        <div style={{ width: 160 }}>
                          <Slider
                            min={32}
                            max={72}
                            value={zoom}
                            onChange={setZoom}
                          />
                        </div>
                      </Space>
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Col>
            <Col xs={24} lg={6}>
              <Card title="Summary">
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Statistic title="Total seats" value={totals.total} />
                  <Statistic
                    title="Available"
                    value={totals.available}
                    valueStyle={{ color: "#16a34a" }}
                  />
                  <Statistic
                    title="Sold"
                    value={totals.sold}
                    valueStyle={{ color: "#dc2626" }}
                  />
                  <Statistic
                    title="VIP"
                    value={totals.vip}
                    valueStyle={{ color: "#ca8a04" }}
                  />
                </Space>
              </Card>
            </Col>
          </Row>
        </Space>
      ),
    };
  });

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card
        title={`Trip ${id} — Seatmap by Carriage`}
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadCarriages}>
            Reload Carriages
          </Button>
        }
      />
      <Tabs
        items={items}
        activeKey={activeKey}
        onChange={setActiveKey}
        destroyInactiveTabPane={false}
      />
    </Space>
  );
}
