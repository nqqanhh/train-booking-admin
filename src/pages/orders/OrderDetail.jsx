// src/pages/orders/OrderDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import {
  Card,
  Table,
  Tag,
  Descriptions,
  Space,
  Statistic,
  Row,
  Col,
  Collapse,
  Typography,
  Timeline,
  Button,
  message,
} from "antd";
import {
  CopyOutlined,
  DollarOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

// small helper – safe getter
const get = (obj, path, dflt = undefined) =>
  path
    .split(".")
    .reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj) ?? dflt;

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/orders/${id}`)
      .then((res) => {
        setOrder(res.data.order);
        setLoading(false);
      })
      .catch((e) => {
        setLoading(false);
        message.error(e.response?.data?.message || e.message);
      });
  }, [id]);

  const succeededPay = useMemo(
    () => (order?.payments || []).find((p) => p.status === "succeeded"),
    [order]
  );
  const initiatedPays = useMemo(
    () => (order?.payments || []).filter((p) => p.status === "initiated"),
    [order]
  );

  const captureId = useMemo(
    () =>
      get(
        succeededPay,
        "raw_payload.purchase_units.0.payments.captures.0.id"
      ) || "",
    [succeededPay]
  );
  const paypalFee = useMemo(
    () =>
      get(
        succeededPay,
        "raw_payload.purchase_units.0.payments.captures.0.seller_receivable_breakdown.paypal_fee.value"
      ) || null,
    [succeededPay]
  );
  const grossAmount = useMemo(
    () =>
      get(
        succeededPay,
        "raw_payload.purchase_units.0.payments.captures.0.seller_receivable_breakdown.gross_amount.value"
      ) || order?.total_amount,
    [succeededPay, order]
  );
  const netAmount = useMemo(
    () =>
      get(
        succeededPay,
        "raw_payload.purchase_units.0.payments.captures.0.seller_receivable_breakdown.net_amount.value"
      ) || null,
    [succeededPay]
  );

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(String(text));
      message.success("Copied");
    } catch {
      message.warning("Cannot copy");
    }
  };

  if (!order) return null;

  // columns
  const itemCols = [
    { title: "Item ID", dataIndex: "id", width: 100 },
    { title: "Trip", dataIndex: "trip_id", width: 100 },
    { title: "Seat", dataIndex: "seat_code", width: 120 },
    { title: "Passenger", dataIndex: "passenger_id", width: 120 },
    {
      title: "Price",
      dataIndex: "price",
      align: "right",
      render: (v) => <>${Number(v).toFixed(2)}</>,
    },
    {
      title: "Ticket",
      dataIndex: ["ticket", "status"],
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Tag color={r.ticket?.status === "used" ? "red" : "green"}>
            {r.ticket?.status || "-"}
          </Tag>
          {r.ticket?.qr_payload && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              QR: {r.ticket.qr_payload}
            </Text>
          )}
        </Space>
      ),
    },
  ];

  const payCols = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "Provider", dataIndex: "provider", width: 100 },
    {
      title: "Txn ID",
      dataIndex: "provider_txn_id",
      render: (v) => (
        <Space>
          <Text code>{v}</Text>
          <Button
            icon={<CopyOutlined />}
            size="small"
            onClick={() => copy(v)}
          />
        </Space>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      align: "right",
      render: (v) => <>${Number(v).toFixed(2)}</>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => (
        <Tag
          color={
            s === "succeeded" ? "green" : s === "initiated" ? "blue" : "red"
          }
        >
          {s}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      render: (t) => new Date(t).toLocaleString(),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card loading={loading} title={`Order #${order.id}`}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Statistic
              title="Status"
              valueRender={() => (
                <Tag color={order.status === "paid" ? "green" : "orange"}>
                  {order.status}
                </Tag>
              )}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              prefix={<DollarOutlined />}
              title="Total (gross)"
              value={Number(grossAmount)}
              precision={2}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title="Created"
              value={new Date(
                order.createdAt || order.created_at
              ).toLocaleString()}
            />
          </Col>
        </Row>

        <Descriptions column={2} size="middle" style={{ marginTop: 16 }}>
          <Descriptions.Item label="User ID">{order.user_id}</Descriptions.Item>
          <Descriptions.Item label="Updated">
            {new Date(order.updatedAt || order.updated_at).toLocaleString()}
          </Descriptions.Item>
          {paypalFee && (
            <Descriptions.Item label="PayPal Fee">
              ${Number(paypalFee).toFixed(2)}
            </Descriptions.Item>
          )}
          {netAmount && (
            <Descriptions.Item label="Net Amount">
              ${Number(netAmount).toFixed(2)}
            </Descriptions.Item>
          )}
          {captureId && (
            <Descriptions.Item label="Capture ID">
              <Space>
                <Text code>{captureId}</Text>
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={() => copy(captureId)}
                />
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="Items">
        <Table
          rowKey="id"
          dataSource={order.items || []}
          columns={itemCols}
          pagination={false}
        />
      </Card>

      <Card title="Payments">
        <Table
          rowKey="id"
          dataSource={order.payments || []}
          columns={payCols}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ background: "#fafafa", padding: 12 }}>
                <Paragraph copyable>
                  {JSON.stringify(record.raw_payload, null, 2)}
                </Paragraph>
              </div>
            ),
            rowExpandable: (record) => !!record.raw_payload,
          }}
          pagination={false}
        />
      </Card>

      <Card title="Timeline">
        <Timeline
          items={[
            {
              color: "blue",
              children: (
                <>
                  <Text strong>Order created</Text>
                  <div>
                    {new Date(
                      order.createdAt || order.created_at
                    ).toLocaleString()}
                  </div>
                </>
              ),
            },
            succeededPay
              ? {
                  color: "green",
                  children: (
                    <>
                      <Text strong>Payment captured</Text>
                      <div>
                        Txn:{" "}
                        <Text code>
                          {captureId || succeededPay.provider_txn_id}
                        </Text>
                      </div>
                      <div>
                        {new Date(
                          succeededPay.updatedAt || succeededPay.updated_at
                        ).toLocaleString()}
                      </div>
                    </>
                  ),
                }
              : {
                  color: "orange",
                  children: (
                    <>
                      <Text strong>Awaiting capture</Text>
                      {initiatedPays?.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          Initiated txns:&nbsp;
                          {initiatedPays.map((p, i) => (
                            <Text key={p.id} code>
                              {p.provider_txn_id}
                              {i < initiatedPays.length - 1 ? ", " : ""}
                            </Text>
                          ))}
                        </div>
                      )}
                    </>
                  ),
                },
            ...((order.items || []).every((i) => i.ticket?.status === "used")
              ? [
                  {
                    color: "gray",
                    children: (
                      <>
                        <Text strong>All tickets used</Text>
                        <div>
                          Last scan:{" "}
                          {new Date(
                            (order.items || [])
                              .map((i) => i.ticket?.used_at)
                              .filter(Boolean)
                              .sort()
                              .slice(-1)[0]
                          ).toLocaleString()}
                        </div>
                      </>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Card>

      <Collapse ghost>
        <Panel
          header={
            <Space>
              <FileSearchOutlined />
              Raw succeeded payload
            </Space>
          }
          key="raw-ok"
        >
          <Paragraph copyable style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(succeededPay?.raw_payload || {}, null, 2)}
          </Paragraph>
        </Panel>
      </Collapse>
    </Space>
  );
}
