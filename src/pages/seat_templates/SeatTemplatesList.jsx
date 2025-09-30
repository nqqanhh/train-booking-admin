// src/pages/seat_templates/SeatTemplatesList.jsx
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
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios.js";

function SeatTemplatesList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  useEffect(() => {
    api.get("/seat-templates").then(({ data }) => {
      setRows(Array.isArray(data) ? data : data.items || []);
    });
  }, []);

  const cols = [
    { title: "ID", dataIndex: "id" },
    { title: "Name", dataIndex: "name" },
    {
      title: "Actions",
      render: (_, r) => (
        <Space>
          <Button
            onClick={() => {
              setEditing(r);
              form.setFieldsValue({
                name: r.name,
              });
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <Link to={`/seat-templates/${r.id}/seatmap`}>Edit seats</Link>
        </Space>
      ),
    },
  ];

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      const payload = {
        ...v,
      };
      if (editing) {
        await api.patch(`/seat-templates/${editing.id}`, payload);
        message.success("Updated template");
      } else {
        await api.post("/seat-templates", payload);
        message.success("Created template");
      }
      setOpen(false);
    } catch (error) {
      message.error(error.response?.data?.message || "Save failed");
    }
  };
  return (
    <Card
      title="Templates"
      extra={
        <Button
          type="primary"
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setOpen(true);
          }}
        >
          Add Template
        </Button>
      }
    >
      <Table rowKey="id" dataSource={rows} columns={cols} />
      <Modal
        title={editing ? "Edit Trip" : "Add Trip"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSave}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="template_name"
            label="Seat template name"
            rules={[{ required: true }]}
          >
            <Input placeholder="Coach-<ABCD>" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default SeatTemplatesList;
