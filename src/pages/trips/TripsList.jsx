import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Popconfirm,
  Space,
  Table,
  Tag,
  message,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
} from "antd";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import dayjs from "dayjs";
import { redirect } from "react-router-dom";

export default function TripsList() {
  const [rows, setRows] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const navigate = useNavigate();
  const fetchTrips = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/trips");
      setRows(data.trips || data);
    } catch (err) {
      message.error("Load trips failed");
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
    fetchTrips();
    fetchRoutes();
  }, []);

  // Map nhanh routeId -> "origin → destination"
  const routeLabelById = useMemo(() => {
    const m = new Map();
    for (const r of routes) {
      m.set(r.id, `${r.origin} → ${r.destination}`);
    }
    return m;
  }, [routes]);

  // Options cho Select routes (value = id, label = origin→destination)
  const routeOptions = useMemo(
    () =>
      routes.map((r) => ({
        value: r.id,
        label: `${r.origin} → ${r.destination}`,
      })),
    [routes]
  );

  const handleDelete = async (id) => {
    try {
      await api.delete(`/trips/${id}`);
      message.success("Deleted trip");
      await fetchTrips();
    } catch {
      message.error("Delete failed");
    }
  };

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      const payload = {
        ...v, // v.route_id là id (Select value), BE nhận route_id bình thường
        departure_time: v.departure_time.format("YYYY-MM-DD HH:mm:ss"),
        arrival_time: v.arrival_time.format("YYYY-MM-DD HH:mm:ss"),
      };
      if (editing) {
        await api.patch(`/trips/${editing.id}`, payload);
        message.success("Updated trip");
      } else {
        await api.post("/trips/create", payload);
        message.success("Created trip");
      }
      setOpen(false);
      await fetchTrips();
    } catch (e) {
      message.error(e.response?.data?.message || "Save failed");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 80 },
    {
      title: "Route",
      dataIndex: "route_id",
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
      title: "Departure",
      dataIndex: "departure_time",
      render: (t) => (t ? dayjs(t).format("DD/MM/YYYY HH:mm") : "-"),
    },
    {
      title: "Arrival",
      dataIndex: "arrival_time",
      render: (t) => (t ? dayjs(t).format("DD/MM/YYYY HH:mm") : "-"),
    },
    { title: "Vehicle", dataIndex: "vehicle_no" },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => (
        <Tag
          color={
            s === "scheduled" ? "blue" : s === "completed" ? "green" : "red"
          }
        >
          {s}
        </Tag>
      ),
    },
    {
      title: "Actions",
      render: (_, r) => (
        <Space>
          <Button
            onClick={() => navigate(`/trips/${r.id}/seatmap-by-carriage`)}
          >
            View carriages
          </Button>
          <Button
            onClick={() => {
              setEditing(r);
              form.setFieldsValue({
                // ensure route_id là ID số
                route_id: r.route_id,
                seat_template_id: r.seat_template_id,
                vehicle_no: r.vehicle_no,
                status: r.status || "scheduled",
                departure_time: r.departure_time
                  ? dayjs(r.departure_time)
                  : null,
                arrival_time: r.arrival_time ? dayjs(r.arrival_time) : null,
              });
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this trip?"
            onConfirm={() => handleDelete(r.id)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Trips"
      extra={
        <Button
          type="primary"
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setOpen(true);
          }}
        >
          Add Trip
        </Button>
      }
    >
      <Table
        rowKey="id"
        dataSource={rows}
        columns={columns}
        loading={loading}
      />

      <Modal
        title={editing ? "Edit Trip" : "Add Trip"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSave}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          {/* Route Select: hiển thị origin→destination, submit value là id */}
          <Form.Item name="route_id" label="Route" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Select route"
              options={routeOptions}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            name="departure_time"
            label="Departure"
            rules={[{ required: true }]}
          >
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="arrival_time"
            label="Arrival"
            rules={[{ required: true }]}
          >
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="vehicle_no"
            label="Vehicle No"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true }]}
            initialValue="scheduled"
          >
            <Select
              options={["scheduled", "closed", "cancelled", "completed"].map(
                (v) => ({
                  label: v,
                  value: v,
                })
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
