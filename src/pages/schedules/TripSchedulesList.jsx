import {
  Card,
  Table,
  Space,
  Button,
  Tag,
  message,
  Input,
  Select,
  DatePicker,
  Modal,
  InputNumber,
  Popconfirm,
  Typography,
  Tooltip,
  Switch,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  //   ReloadTimeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import api from "../../api/axios";
import { useEffect, useState, useMemo } from "react";

import TripScheduleForm from "./TripScheduleForm.jsx";

const { RangePicker } = DatePicker;
const { Text } = Typography;

export default function TripSchedulesList() {
  const [rows, setRows] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [genOpen, setGenOpen] = useState(false);
  const [genDays, setGenDays] = useState(7);
  const [genTarget, setGenTarget] = useState(null);

  const [filters, setFilters] = useState({
    q: "",
    status: undefined, // active/inactive
    freq: undefined, // daily/weekly
    dateRange: null,
  });

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/trip-schedules/");
      const items = data?.items || [];
      setRows(items);
    } catch (error) {
      message.error(error.response?.data?.message || "Fetch schedules failed");
    } finally {
      setLoading(false);
    }
  };
  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/routes");
      setRoutes(data.items || data);
    } catch (err) {
      message.error("Load routes failed");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSchedules();
    fetchRoutes();
  }, []);
  const routeLabelById = useMemo(() => {
    const m = new Map();
    for (const r of routes) {
      m.set(r.id, `${r.origin} → ${r.destination}`);
    }
    return m;
  }, [routes]);


  const filtered = useMemo(() => {
    const q = (filters.q || "").toLowerCase();
    const [d1, d2] = filters.dateRange || [];
    return rows.filter((r) => {
      if (filters.status && r.status !== filters.status) return false;
      if (filters.freq && r.freq !== filters.freq) return false;
      if (q) {
        const hay =
          `${r.vehicle_no} ${r.route_id} ${r.depart_hm}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (d1 && d2) {
        // lọc theo khoảng hiệu lực (overlap)
        const sd = r.start_date ? new Date(r.start_date) : null;
        const ed = r.end_date ? new Date(r.end_date) : null;
        const from = d1.toDate();
        const to = d2.toDate();
        const overlaps = (sd ? sd <= to : true) && (ed ? ed >= from : true);
        if (!overlaps) return false;
      }
      return true;
    });
  }, [rows, filters]);

  const onCreate = () => {
    setEditing(null);
    setOpenForm(true);
  };
  const onEdit = (rec) => {
    setEditing(rec);
    setOpenForm(true);
  };

  const onSubmit = async (value) => {
    const id = editing?.id ?? null;
    // console.log("id:", id);
    // console.log("value:", value);
    try {
      if (id != null) {
        await api.put(`/trip-schedules/${id}`, value.payload);
        message.success("Schedule updated");
      } else {
        await api.post("/trip-schedules", value.payload);
        message.success("Schedule created");
      }
      setOpenForm(false);
      setEditing(null);
      fetchSchedules();
    } catch (error) {
      message.error(error.response?.data?.message || "Save failed");
    }
  };

  const handleToggleStatus = async (rec, checked) => {
    // Đừng dùng if (!id) vì 0 là falsy; kiểm tra null/undefined thôi
    const id = rec?.id;
    if (id === null || id === undefined) {
      return message.error("Invalid schedule id");
    }
    const nextStatus = checked ? "active" : "inactive";

    // Optimistic update
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
    );

    try {
      const url = `/trip-schedules/${id}`;
      console.log("[PUT]", url, { status: nextStatus });
      await api.put(url, { status: nextStatus });
      message.success("Status updated");
      // hoặc fetchData() nếu muốn chắc ăn
    } catch (err) {
      console.error("[PUT error]", err);
      message.error(err?.response?.data?.message || "Update status failed");
      // rollback
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: rec.status } : r))
      );
    }
  };

  const openGenerate = (rec) => {
    setGenTarget(rec);
    setGenDays(7);
    setGenOpen(true);
  };

  const doGenerate = async () => {
    try {
      await api.post(`/trip-schedules/${genTarget.id}/generate`, null, {
        params: { days: genDays },
      });
      message.success(`Generated trip for next ${genDays} day(s)`);
      setGenOpen(false);
      setGenTarget(null);
    } catch (error) {
      message.error(error.response?.data?.message || "Generate failed");
    }
  };
  const cols = [
    { title: "ID", dataIndex: "id", width: 70 },
    {
      title: "Route",
      dataIndex: "route_id",
      width: 180,
      render: (_, r) => {
        // ưu tiên dùng r.route nếu BE đã include
        if (r.route?.origin && r.route?.destination) {
          return `${r.route.origin} → ${r.route.destination}`;
        }
        // fallback map từ route_id
        return routeLabelById.get(r.route_id) || `#${r.route_id}`;
      },
    },
    {
      title: "Vehicle",
      dataIndex: "vehicle_no",
      width: 100,
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: "Freq",
      dataIndex: "freq",
      width: 100,
      render: (v) => <Tag color={v === "daily" ? "green" : "blue"}>{v}</Tag>,
    },
    {
      title: "Days",
      dataIndex: "days_of_week",
      width: 140,
      render: (v, r) => (r.freq === "daily" ? <span>1–7</span> : v || "-"),
    },
    { title: "Start", dataIndex: "start_date", width: 110 },
    {
      title: "End",
      dataIndex: "end_date",
      width: 110,
      render: (v) => v || "-",
    },
    { title: "Depart", dataIndex: "depart_hm", width: 90 },
    { title: "ETA (min)", dataIndex: "eta_minutes", width: 110 },
    { title: "TZ", dataIndex: "timezone", width: 150, ellipsis: true },
    {
      title: "Status",
      dataIndex: "status",
      width: 140,
      render: (s, rec) => (
        <Space>
          <Tag color={s === "active" ? "green" : "default"}>{s}</Tag>
          <Switch
            size="small"
            checked={s === "active"}
            onChange={(checked, e) => {
              e?.stopPropagation?.();
              handleToggleStatus(rec, checked); // <-- truyền rec + checked
            }}
          />
        </Space>
      ),
    },
    {
      title: "Carriages",
      dataIndex: "carriages_json",
      width: 140,
      render: (arr) =>
        Array.isArray(arr) ? <span>{arr.length} def</span> : "-",
    },
    {
      title: "Actions",
      fixed: "right",
      width: 220,
      render: (_, rec) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(rec)}
          >
            Edit
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => openGenerate(rec)}
          >
            Generate
          </Button>
        </Space>
      ),
    },
  ];
  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Card
        title="Trip schedules"
        extra={
          <Space wrap>
            <Input
              placeholder="Search vehicle/route"
              allowClear
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              style={{ width: 220 }}
            />
            <Select
              placeholder="Freq"
              allowClear
              value={filters.freq}
              onChange={(v) => setFilters({ ...filters, freq: v })}
              options={[
                { value: "daily", label: "daily" },
                { value: "weekly", label: "weekly" },
              ]}
              style={{ width: 140 }}
            />
            <Select
              placeholder="Status"
              allowClear
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
              options={[
                { value: "active", label: "active" },
                { value: "inactive", label: "inactive" },
              ]}
              style={{ width: 140 }}
            />
            <RangePicker
              onChange={(v) => setFilters({ ...filters, dateRange: v })}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchSchedules}>
              Reload
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
              New Schedule
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={cols}
          dataSource={filtered}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      {/* Form */}
      <TripScheduleForm
        open={openForm}
        initialValues={editing}
        onCancel={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        onSubmit={onSubmit}
      />
      {/*  */}
      {/* Modal */}
      <Modal
        title={`Generate trips ${
          genTarget ? `for #${genTarget.id} (${genTarget.vehicle_no})` : ""
        }  `}
        open={genOpen}
        onCancel={() => setGenOpen(false)}
        onOk={doGenerate}
        okText="Generate"
      >
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <div>
            Generate trips for the next{" "}
            <InputNumber
              min={1}
              max={60}
              value={genDays}
              onChange={setGenDays}
            />{" "}
            day(s).
          </div>
          <div>
            Trips are idempotent: duplicates (same route + departure_time +
            vehicle_no) will be skipped.
          </div>
        </Space>
      </Modal>
      {/*  */}
    </Space>
  );
}
