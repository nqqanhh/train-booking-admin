import React, { useEffect, useState } from "react";
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

function RouteList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/routes");
      setRows(data.items || data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchRoutes();
  }, []);
  const onCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const onEdit = (rec) => {
    setEditing(rec);
    form.setFieldsValue({ ...rec, active: rec.isActive || rec.active });
    setOpen(true);
  };

  const onSubmit = async () => {
    const validate = await form.validateFields();
    console.log("Form data:", validate);
    try {
      if (editing) {
        console.log("Updating route with ID:", editing.id);
        const response = await api.post(`/routes/update/${editing.id}`, {
          origin: validate.origin,
          destination: validate.destination,
          distance_km: validate.distance_km,
          eta_minutes: validate.eta_minutes,
          isActive: true,
        });
        console.log("Update response:", response.data);
        message.success("Updated");
      } else {
        console.log("Creating new route");
        const response = await api.post("/routes/create", validate);
        console.log("Create response:", response.data);
        message.success("Route created");
      }
      setOpen(false);
      fetchRoutes();
    } catch (error) {
      console.error("Error:", error);
      message.error(error.response?.data?.message || "Save failed");
    }
  };

  const cols = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "Origin", dataIndex: "origin" },
    { title: "Destination", dataIndex: "destination" },
    { title: "Distance (km)", dataIndex: "distance_km" },
    { title: "ETA (min)", dataIndex: "eta_minutes" },
    { title: "Active", dataIndex: "active", render: (v) => (v ? "Yes" : "No") },
    {
      title: "Actions",
      render: (_, rec) => (
        <Space>
          <Button size="small" onClick={() => onEdit(rec)}>
            Edit
          </Button>
        </Space>
      ),
    },
  ];
  return (
    <>
      <Space>
        <Button onClick={onCreate}>New Route</Button>
      </Space>
      <Table
        rowkey="id"
        loading={loading}
        columns={cols}
        dataSource={rows}
      ></Table>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSubmit}
        title={editing ? "Edit Route" : "New Route"}
      >
        <Form layout="vertical" form={form} initialValues={{ active: true }}>
          <Form.Item name="origin" label="Origin" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="destination"
            label="Destination"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="distance_km" label="Distance (km)">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="eta_minutes" label="ETA (min)">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default RouteList;
