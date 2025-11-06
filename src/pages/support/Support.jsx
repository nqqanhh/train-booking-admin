import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
} from "antd";
import api from "../../api/axios";

export default function Support() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: undefined,
    full_name: undefined,
    email: undefined,
    q: "",
    subject: undefined,
  });
  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        full_name: filters.full_name,
        email: filters.email,
        subject: filters.subject,
        status: filters.status,
        q: filters.q || undefined,
      };
      const { data } = await api.get("/support-requests", { params });
      const items = data?.supReq || data || [];
      setRows(items);
      setPagination({
        current: page,
        pageSize,
        total: data?.total || data?.count || items.length,
      });
    } catch (e) {
      message.error(e.response?.data?.message || "Load requests failed");
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
      user_id: undefined,
      q: "",
      subject: undefined,
    });
    fetchData(1, pagination.pageSize);
  };

  const cols = [
    { title: "ID", dataIndex: "id", width: 80 },
    {
      title: "User (Full name)",
      render: (_, rec) => rec.user?.full_name ?? "-",
    },
    { title: "Email", render: (_, rec) => rec.user?.email ?? "-" },
    { title: "Subject", dataIndex: "subject" },
    { title: "Message", dataIndex: "message" },
    { title: "Status", dataIndex: "status" },
    {
      title: "Actions",
      render: (_, rec) => (
        <Space>
          <Button size="small" onClick={() => console.log("hahaha")}>
            Edit
          </Button>
        </Space>
      ),
    },
  ];
  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
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
