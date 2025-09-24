import { ConfigProvider, Layout, Menu } from "antd";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/auth/Login.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import RoutesList from "./pages/routes/RouteList.jsx";
import SeatTemplatesList from "./pages/seat_templates/SeatTemplatesList.jsx";
import SeatMapEditor from "./pages/seat_templates/SeatMapEditor.jsx";
import TripsList from "./pages/trips/TripsList.jsx";
import OrdersList from "./pages/orders/OrdersList.jsx";
import UsersList from "./pages/users/UsersList.jsx";

const { Header, Sider, Content } = Layout;

export default function App() {
  return (
    <ConfigProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="*"
            element={
              // <ProtectedRoute roles={["admin"]}>
              <Layout style={{ minHeight: "100vh" }}>
                <Sider theme="light">
                  <Menu mode="inline">
                    <Menu.Item key="dash">
                      <Link to="/">Dashboard</Link>
                    </Menu.Item>
                    <Menu.Item key="routes-managing">
                      <Link to="/routes-managing">Routes</Link>
                    </Menu.Item>
                    <Menu.Item key="seatTpl">
                      <Link to="/seat-templates">Seat Templates</Link>
                    </Menu.Item>
                    <Menu.Item key="trips">
                      <Link to="/trips">Trips</Link>
                    </Menu.Item>
                    <Menu.Item key="orders">
                      <Link to="/orders">Orders</Link>
                    </Menu.Item>
                    <Menu.Item key="users">
                      <Link to="/users">Users</Link>
                    </Menu.Item>
                  </Menu>
                </Sider>
                <Layout>
                  <Header style={{ background: "#fff" }} />
                  <Content style={{ padding: 24 }}>
                    <Routes>
                      <Route index element={<Dashboard />} />
                      <Route path="routes-managing" element={<RoutesList />} />
                      <Route
                        path="seat-templates"
                        element={<SeatTemplatesList />}
                      />
                      <Route
                        path="seat-templates/:id/seatmap"
                        element={<SeatMapEditor />}
                      />
                      <Route path="trips" element={<TripsList />} />
                      <Route path="orders" element={<OrdersList />} />
                      <Route path="users" element={<UsersList />} />
                    </Routes>
                  </Content>
                </Layout>
              </Layout>
              // </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
