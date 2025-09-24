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

function TripsList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const fetchTrips = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/trips`);
      setRows(data.trips || data);
    } catch (error) {
      message.error();
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTrips();
  }, []);
  const onCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const onEdit = (rec) => {
    setEditing(rec);
    form.setFieldValue(rec);
    setOpen(true);
  };

  // const onSubmit = async () => {
  //   const validate = await form.validateFields();
  //   try {
  //     if (editing) {
  //       await api.post(`/routes/update/${editing.id}`, {
  //         origin: validate.origin,
  //         destination: validate.destination,
  //         distance_km: validate.distance_km,
  //         eta_minutes: validate.eta_minutes,
  //         isActive: validate.isActive,
  //       });
  //       message.success("Updated");
  //     } else {
  //       await api.post("/routes/create", validate);
  //       message.success("Route created");
  //     }
  //     setOpen(false);
  //     load();
  //   } catch (error) {
  //     message.error(error.response?.data?.message || "Save failed");
  //   }
  // };

  // const onDelete = async (rec) => {
  //   Modal.confirm({
  //     title: `Delete route ${rec.origin}-${rec.destination}?`,
  //     onOk: async () => [await api.post("/routes/delete")],
  //   });
  // };
  const cols = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "Departure time", dataIndex: "departure_time" },
    { title: "Arrival time", dataIndex: "arrival_time" },
    { title: "Train no", dataIndex: "vehicle_no" },
    { title: "status", dataIndex: "status" },
    {
      title: "Seat template",
      dataIndex: "seat_template_id",
    },
    {
      title: "Actions",
      render: (_, rec) => (
        <Space>
          <Button size="small" onClick={() => onEdit(rec)}>
            Edit
          </Button>
          <Button size="small" danger onClick={() => onDelete(rec)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];
  return (
    <>
      <Space>
        <Button>New Route</Button>
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
        onOk={() => console.log("submit")}
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

export default TripsList;
