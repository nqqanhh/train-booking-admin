import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Button,
  message,
  Typography,
} from "antd";
import api from "../../api/axios";

const { Paragraph, Text } = Typography;

export default function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tickets/${id}`);
      setTicket(data);
    } catch (e) {
      message.error(e.response?.data?.message || "Load ticket failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [id]);

  const markUsed = async () => {
    try {
      await api.post(`/tickets/${id}/mark-used`);
      message.success("Ticket marked used");
      load();
    } catch (e) {
      message.error(e.response?.data?.message || "Mark used failed");
    }
  };

  const refund = async () => {
    try {
      await api.post(`/tickets/${id}/refund`);
      message.success("Ticket refunded");
      load();
    } catch (e) {
      message.error(e.response?.data?.message || "Refund failed");
    }
  };

  if (!ticket) return <Card loading={loading}>Loading...</Card>;

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card
        title={`Ticket #${ticket.id}`}
        loading={loading}
        extra={
          <Space>
            <Button onClick={load}>Reload</Button>
            <Button
              type="primary"
              onClick={markUsed}
              disabled={ticket.status === "used"}
            >
              Mark used
            </Button>
            <Button danger onClick={refund}>
              Refund
            </Button>
          </Space>
        }
      >
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="Status">
            <Tag
              color={
                ticket.status === "used"
                  ? "red"
                  : ticket.status === "issued"
                  ? "green"
                  : "default"
              }
            >
              {ticket.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Order Item">
            {ticket.order_item_id}
          </Descriptions.Item>
          <Descriptions.Item label="Trip">
            {ticket.trip_id || ticket.order_item?.trip_id || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Seat">
            {ticket.seat_code || ticket.order_item?.seat_code || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Issued at">
            {ticket.issued_at
              ? new Date(ticket.issued_at).toLocaleString()
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Used at">
            {ticket.used_at ? new Date(ticket.used_at).toLocaleString() : "-"}
          </Descriptions.Item>
        </Descriptions>

        <Card type="inner" title="QR payload" style={{ marginTop: 16 }}>
          <Paragraph copyable>
            <Text code>
              {ticket.qr_payload ||
                JSON.stringify({
                  order_item_id: ticket.order_item_id,
                  seat_code: ticket.seat_code,
                })}
            </Text>
          </Paragraph>
          <Space>
            <Link
              to={`/orders/${
                ticket.order_item?.order_id || ticket.order_id || ""
              }`}
            >
              Go to Order
            </Link>
          </Space>
        </Card>
      </Card>
    </Space>
  );
}
