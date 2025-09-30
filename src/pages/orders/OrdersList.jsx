// src/pages/orders/OrdersList.jsx
import { Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

export default function OrdersList() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get("/orders").then((res) => setRows(res.data.items || []));
  }, []);

  const cols = [
    { title: "ID", dataIndex: "id" },
    { title: "User", dataIndex: "user_id" },
    { title: "Total", dataIndex: "total_amount" },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => <Tag color={s === "paid" ? "green" : "orange"}>{s}</Tag>,
    },
    {
      title: "Actions",
      render: (_, r) => <Link to={`/orders/${r.id}`}>Detail</Link>,
    },
  ];
  return <Table rowKey="id" dataSource={rows} columns={cols} />;
}
