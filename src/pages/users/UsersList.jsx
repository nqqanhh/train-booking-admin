import { Card, message, Table, Tag, Space, Popconfirm, Button } from "antd";
import React, { useEffect, useState } from "react";
import api from "../../api/axios";

function UsersList() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/profile/users");
      setRows(data.users || data);
    } catch (error) {
      message.error(error.response?.data?.message || "Fetch user failed");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id) => {
    setLoading(true);
    try {
      await api.post(`/profile/${id}`);
      // Refresh data after successful update
      await fetchUsers();
      message.success("User status updated successfully");
    } catch (error) {
      message.error(error.response?.data?.message || "Set user status failed");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    handleToggleStatus;
  }, []);
  const columns = [
    { title: "ID", dataIndex: "id", width: 80 },

    {
      title: "Full Name",
      dataIndex: "full_name",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    { title: "Phone", dataIndex: "phone" },
    { title: "Role", dataIndex: "role" },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => (
        <Tag
          color={s === "inactive" ? "blue" : s === "active" ? "green" : "red"}
        >
          {s}
        </Tag>
      ),
    },
    {
      title: "Actions",
      render: (_, r) => (
        <Space>
          {/* <Button
            onClick={() => navigate(`/trips/${r.id}/seatmap-by-carriage`)}
          >
            View carriages
          </Button> */}
          {/* <Button
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
          </Button> */}
          <Popconfirm
            title="Confirm?"
            onConfirm={() => handleToggleStatus(r.id)}
          >
            {r.status === "active" ? (
              <Button danger>Ban user</Button>
            ) : (
              <Button primary>Active user</Button>
            )}
          </Popconfirm>
        </Space>
      ),
    },
  ];
  return (
    <Card title="Users">
      <Table
        rowKey="id"
        dataSource={rows}
        columns={columns}
        loading={loading}
      />
    </Card>
  );
}

export default UsersList;
