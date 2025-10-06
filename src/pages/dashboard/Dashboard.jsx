import { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, DatePicker, Space, message } from "antd";
import {
  DollarOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import api from "../../api/axios";
import dayjs from "dayjs";
import * as echarts from "echarts/core";
import { LineChart, BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
]);
const { RangePicker } = DatePicker;

export default function Dashboard() {
  const [range, setRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [loading, setLoading] = useState(false);
  const [kpi, setKpi] = useState({ revenue: 0, paid_orders: 0, seats_sold: 0 });
  const [series, setSeries] = useState([]); // [{date, revenue, seats}]

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const params = {
        from: range[0].format("YYYY-MM-DD"),
        to: range[1].format("YYYY-MM-DD"),
      };
      // Nếu backend có /orders/metrics thì dùng:
      const { data } = await api
        .get("/orders/metrics", { params })
        .catch(() => ({ data: null })); // fallback nếu API chưa có

      if (data) {
        setKpi({
          revenue: Number(data.revenue || 0),
          paid_orders: Number(data.paid_orders || 0),
          seats_sold: Number(data.seats_sold || 0),
        });
        setSeries(data.daily || []);
      } else {
        // Fallback: tự tính từ /orders?status=paid
        const { data: orders } = await api.get("/orders", {
          params: { status: "paid", ...params },
        });
        const arr = orders?.items ?? orders ?? [];
        let rev = 0,
          po = 0,
          seats = 0;
        const map = {};
        for (const o of arr) {
          rev += Number(o.total_amount || 0);
          po += 1;
          const day = (o.createdAt || o.updatedAt || "").slice(0, 10);
          map[day] = map[day] || { date: day, revenue: 0, seats: 0 };
          map[day].revenue += Number(o.total_amount || 0);
          const items = o.items || [];
          seats += items.length;
          map[day].seats += items.length;
        }
        setKpi({ revenue: rev, paid_orders: po, seats_sold: seats });
        setSeries(
          Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
        );
      }
    } catch (e) {
      message.error(e.response?.data?.message || "Load metrics failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [range]);

  useEffect(() => {
    // render chart
    const el = document.getElementById("revChart");
    if (!el) return;
    const chart = echarts.init(el);
    chart.setOption({
      tooltip: { trigger: "axis" },
      legend: { data: ["Revenue", "Seats sold"] },
      xAxis: { type: "category", data: series.map((s) => s.date) },
      yAxis: [
        { type: "value", name: "Revenue" },
        { type: "value", name: "Seats", minInterval: 1 },
      ],
      grid: { left: 60, right: 60, bottom: 40, top: 50 },
      series: [
        {
          name: "Revenue",
          type: "line",
          smooth: true,
          data: series.map((s) => s.revenue),
        },
        {
          name: "Seats sold",
          type: "bar",
          yAxisIndex: 1,
          data: series.map((s) => s.seats),
        },
      ],
    });
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, [series]);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={12}>
      <Card
        title="Revenue & Occupancy"
        extra={<RangePicker value={range} onChange={setRange} />}
        loading={loading}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Revenue (USD)"
                value={kpi.revenue}
                precision={2}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Paid Orders"
                value={kpi.paid_orders}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Seats Sold"
                value={kpi.seats_sold}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
        </Row>
        <div id="revChart" style={{ height: 360, marginTop: 16 }} />
      </Card>
    </Space>
  );
}
