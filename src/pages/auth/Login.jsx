import React from "react";
import { Card, Form, Input, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth";
import { message } from "antd";

function Login() {
  const nav = useNavigate();
  const setUser = useAuth((s) => s.setUser);

  const onFinish = async (v) => {
    try {
      const { data } = await api.post("/auth/login", v);
      localStorage.setItem("access_token", data.token.access_token);
      setUser(data.user);
      nav("/");
    } catch (error) {
      message.error(error.response?.data?.message || "Login failed");
    }
  };
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 80 }}>

      <Card title="Admin Login" style={{ width: 360 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
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
      </Card>
    </div>
  );
}

export default Login;
