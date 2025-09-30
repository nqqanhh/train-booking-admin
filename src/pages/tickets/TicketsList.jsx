import { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
} from "antd";
import { Link } from "react-router-dom";
import api from "../../api/axios";
const { RangePicker } = DatePicker;

export default function TicketsList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: undefined,
    trip_id: undefined,
    q: "",
    from: null,
    to: null,
  });

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        status: filters.status,
        trip_id: filters.trip_id,
        q: filters.q || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      };
      const { data } = await api.get("/tickets", { params });
      const items = data?.items || data?.tickets || data || [];
      setRows(items);
      setPagination({
        current: page,
        pageSize,
        total: data?.total || data?.count || items.length,
      });
    } catch (e) {
      message.error(e.response?.data?.message || "Load tickets failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(
      pagination.current,
      pagination.pageSize
    ); /* eslint-disable-next-line */
  }, []);

  const onSearch = () => fetchData(1, pagination.pageSize);
  const onReset = () => {
    setFilters({
      status: undefined,
      trip_id: undefined,
      q: "",
      from: null,
      to: null,
    });
    fetchData(1, pagination.pageSize);
  };

  const markUsed = async (id) => {
    try {
      await api.post(`/tickets/${id}/mark-used`);
      message.success("Ticket marked used");
      fetchData(pagination.current, pagination.pageSize);
    } catch (e) {
      message.error(e.response?.data?.message || "Mark used failed");
    }
  };

  const refund = async (id) => {
    try {
      await api.post(`/tickets/${id}/refund`);
      message.success("Ticket refunded");
      fetchData(pagination.current, pagination.pageSize);
    } catch (e) {
      message.error(e.response?.data?.message || "Refund failed");
    }
  };

  const cols = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "Order Item", dataIndex: "order_item_id", width: 110 },
    {
      title: "Trip",
      dataIndex: ["order_item", "trip_id"],
      render: (v, r) => r.trip_id || r?.order_item?.trip_id || "-",
      width: 90,
    },
    {
      title: "Seat",
      dataIndex: "seat_code",
      render: (v, r) => r.seat_code || r?.order_item?.seat_code || "-",
      width: 90,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (s) => (
        <Tag
          color={s === "used" ? "red" : s === "issued" ? "green" : "default"}
        >
          {s}
        </Tag>
      ),
    },
    {
      title: "Issued At",
      dataIndex: "issued_at",
      render: (t) => (t ? new Date(t).toLocaleString() : "-"),
      width: 180,
    },
    {
      title: "Used At",
      dataIndex: "used_at",
      render: (t) => (t ? new Date(t).toLocaleString() : "-"),
      width: 180,
    },
    {
      title: "Actions",
      width: 220,
      render: (_, r) => (
        <Space>
          <Link to={`/tickets/${r.id}`}>Detail</Link>
          <Popconfirm
            title="Mark this ticket as used?"
            onConfirm={() => markUsed(r.id)}
            disabled={r.status === "used"}
          >
            <Button size="small" disabled={r.status === "used"}>
              Mark used
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Refund this ticket?"
            onConfirm={() => refund(r.id)}
          >
            <Button size="small" danger>
              Refund
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Space wrap>
        <Input
          placeholder="Search ticket/order item/seat"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          style={{ width: 260 }}
          allowClear
        />
        <Select
          placeholder="Status"
          allowClear
          value={filters.status}
          onChange={(v) => setFilters({ ...filters, status: v })}
          options={[
            { value: "issued", label: "Issued" },
            { value: "used", label: "Used" },
            { value: "refunded", label: "Refunded" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          style={{ width: 160 }}
        />
        <Input
          placeholder="Trip ID"
          value={filters.trip_id}
          onChange={(e) => setFilters({ ...filters, trip_id: e.target.value })}
          style={{ width: 120 }}
          allowClear
        />
        <RangePicker
          onChange={(dates) =>
            setFilters({
              ...filters,
              from: dates?.[0]?.toISOString() || null,
              to: dates?.[1]?.toISOString() || null,
            })
          }
        />
        <Button type="primary" onClick={onSearch}>
          Search
        </Button>
        <Button onClick={onReset}>Reset</Button>
        <Link to="/tickets/scanner">
          <Button>Scanner</Button>
        </Link>
      </Space>

      <Table
        rowKey="id"
        columns={cols}
        dataSource={rows}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (p, ps) => fetchData(p, ps),
        }}
      />
    </Space>
  );
}
