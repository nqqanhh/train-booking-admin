import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Tabs, message, Typography } from "antd";
import api from "../../api/axios";
import { useAuth } from "../../store/auth";

const { Title } = Typography;

export default function Login() {
  const nav = useNavigate();
  const setUser = useAuth((s) => s.setUser);

  const onFinishEmail = async (v) => {
    try {
      const { data } = await api.post("/auth/login", {
        email: v.email,
        password: v.password,
      });
      // BE trả { message, user: {...}, tokens: { access_token } }
      localStorage.setItem("access_token", data.tokens.access_token);
      setUser(data.user);
      message.success("Đăng nhập thành công");
      nav("/");
    } catch (e) {
      message.error(e.response?.data?.message || "Login failed");
    }
  };

  const onFinishPhone = async (v) => {
    try {
      const { data } = await api.post("/auth/login", {
        phone: v.phone,
        password: v.password,
      });
      localStorage.setItem("access_token", data.tokens.access_token);
      setUser(data.user);
      message.success("Đăng nhập thành công");
      nav("/dashboard");
    } catch (e) {
      message.error(e.response?.data?.message || "Login failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        display: "grid",
        placeItems: "center",
        backgroundColor: "#5A8CFF",
      }}
    >
      <Card style={{ width: 380 }}>
        <Title level={4} style={{ textAlign: "center", marginBottom: 16 }}>
          Admin Login
        </Title>
        <Tabs
          defaultActiveKey="email"
          items={[
            {
              key: "email",
              label: "Email",
              children: (
                <Form layout="vertical" onFinish={onFinishEmail}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[{ required: true }]}
                  >
                    <Input.Password />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block>
                    Login
                  </Button>
                </Form>
              ),
            },
            {
              key: "phone",
              label: "Phone",
              children: (
                <Form layout="vertical" onFinish={onFinishPhone}>
                  <Form.Item
                    name="phone"
                    label="Phone"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[{ required: true }]}
                  >
                    <Input.Password />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block>
                    Login
                  </Button>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
