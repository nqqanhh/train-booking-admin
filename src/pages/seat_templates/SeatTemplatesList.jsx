import { Table } from "antd";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios.js";
function SeatTemplatesList() {
  const [rows, setRows] = useState([]);
  const fetchTemplates = async () => {
    const { data } = await api.get("/seat-templates");
    setRows(data.items || data);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const cols = [
    { title: "ID", dataIndex: "id" },
    { title: "Name", dataIndex: "name" },
    {
      title: "Actions",
      render: (_, r) => (
        <Link to={`/seat-templates/${r.id}/seatmap`}>Edit seats</Link>
      ),
    },
  ];
  return <Table rowKey="id" dataSource={rows} columns={cols} />;
}

export default SeatTemplatesList;
