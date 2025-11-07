import { useState } from "react";
import { Layout, Menu, Button, theme } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  //   RouteOutlined,
  HeatMapOutlined,
  ScheduleOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  QrcodeOutlined,
  CustomerServiceOutlined,
  NotificationOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";
import trainLogo from "../assets/simple_train_booking_app_icon.jpg";

const { Header, Sider, Content } = Layout;

const items = [
  {
    key: "/",
    icon: <DashboardOutlined />,
    label: <Link to="/">Dashboard</Link>,
  },
  {
    key: "/users",
    icon: <UserOutlined />,
    label: <Link to="/users">Users</Link>,
  },
  {
    key: "/routes",
    icon: <HeatMapOutlined />,
    label: <Link to="/routes">Routes</Link>,
  },
  {
    key: "/trips",
    icon: <ScheduleOutlined />,
    label: <Link to="/trips">Trips</Link>,
  },
  {
    key: "/trip-schedules",
    icon: <ScheduleOutlined />,
    label: <Link to="/trip-schedules">Trip Schedules</Link>,
  },
  {
    key: "/seat-templates",
    icon: <AppstoreOutlined />,
    label: <Link to="/seat-templates">Seat Map</Link>,
  },
  {
    key: "/orders",
    icon: <ShoppingCartOutlined />,
    label: <Link to="/orders">Orders</Link>,
  },
  // {
  //   key: "/payments",
  //   icon: <CreditCardOutlined />,
  //   label: <Link to="/payments">Payments</Link>,
  // },
  {
    key: "/tickets",
    icon: <QrcodeOutlined />,
    label: <Link to="/tickets">Tickets</Link>,
  },
  {
    key: "/support",
    icon: <CustomerServiceOutlined />,
    label: <Link to="/support">Support</Link>,
  },
  // {
  //   key: "/notifications",
  //   icon: <NotificationOutlined />,
  //   label: <Link to="/notifications">Notifications</Link>,
  // },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { token } = theme.useToken();
  const logout = useAuth((s) => s.logout);

  // lấy key đang active theo path
  const selectedKeys = (() => {
    const match = items.find((i) => location.pathname.startsWith(i.key));
    return match ? [match.key] : ["/"];
  })();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        theme="light"
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={{
          borderRight: "1px solid #f0f0f0",
        }}
      >
        <div
          style={{
            height: 56,
            display: "flex",
            alignItems: "center",
            padding: collapsed ? "0 8px" : "0 16px",
            fontWeight: 700,
            fontSize: 16,
            borderBottom: "1px solid #f0f0f0",
            gap: 8,
          }}
        >
          {collapsed ? (
            <img src={trainLogo} width={"70%"} />
          ) : (
            <p
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
              }}
            >
              <img src={trainLogo} width={"20%"} height={"20%"} />
              Admin
            </p>
          )}
        </div>
        <Menu mode="inline" selectedKeys={selectedKeys} items={items}  />
      </Sider>

      <Layout style={{ maxWidth: "90vw", width: "85vw" }}>
        <Header
          style={{
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((x) => !x)}
          />
          <Button icon={<LogoutOutlined />} onClick={logout}>
            Logout
          </Button>
        </Header>

        <Content
          style={{
            padding: 24,
            background: token.colorBgContainer,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
