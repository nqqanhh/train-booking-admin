import { Card, Col, Row, Statistic, Table } from "antd";
import { ArrowUpOutlined } from "@ant-design/icons";

const columns = [
  { title: "Order #", dataIndex: "id" },
  { title: "User", dataIndex: "user" },
  { title: "Amount", dataIndex: "amount" },
  { title: "Status", dataIndex: "status" },
];

const data = [
  { id: 101, user: "Nguyen A", amount: 600000, status: "paid" },
  { id: 102, user: "Tran B", amount: 450000, status: "pending" },
];

export default function Dashboard() {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={6}>
        <Card>
          <Statistic
            title="New Users (today)"
            value={12}
            prefix={<ArrowUpOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card>
          <Statistic title="Orders (today)" value={34} />
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card>
          <Statistic title="Revenue (today)" value={12800000} />
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card>
          <Statistic title="Trips upcoming" value={9} />
        </Card>
      </Col>

      <Col span={24}>
        <Card title="Recent Orders">
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={false}
          />
        </Card>
      </Col>
    </Row>
  );
}
