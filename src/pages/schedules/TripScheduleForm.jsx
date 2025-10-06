import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  Typography,
  Space,
} from "antd";
import api from "../../api/axios";
import CarriagesEditor from "./CarriagessEditor.jsx";

const { TextArea } = Input;
const { Text } = Typography;

const tzOptions = [
  { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho_Chi_Minh" },
  { value: "UTC", label: "UTC" },
];
const freqOptions = [
  { value: "daily", label: "daily" },
  { value: "weekly", label: "weekly" },
];

function tryParseJSON(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}
function pretty(obj) {
  try {
    return JSON.stringify(obj ?? null, null, 2);
  } catch {
    return "";
  }
}
const sampleCarriages = [
  { seat_template_id: 1, carriage_no: 1, name: "Coach 40" },
  { seat_template_id: 2, carriage_no: 2, name: "Coach 56" },
];

export default function TripScheduleForm({
  open,
  initialValues,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const [routeOptions, setRouteOptions] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(false);

  // Load routes 1 lần để hiển thị "origin → destination"
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setRoutesLoading(true);
        const { data } = await api.get("/routes"); // baseURL đã /api
        const arr = data?.items ?? data ?? [];
        const opts = arr.map((r) => ({
          value: r.id,
          label:
            [r.origin, r.destination].filter(Boolean).join(" → ") || `#${r.id}`,
        }));
        // nếu đang edit mà option chưa có (rare), thêm fallback
        const rid = initialValues?.route_id;
        if (rid && !opts.some((o) => o.value === rid)) {
          opts.unshift({ value: rid, label: `#${rid}` });
        }
        setRouteOptions(opts);
      } catch (e) {
        setRouteOptions([]);
      } finally {
        setRoutesLoading(false);
      }
    })();
  }, [open, initialValues?.route_id]);

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      form.setFieldsValue({
        id: initialValues.id ?? null,
        route_id: initialValues.route_id, // Select sẽ chọn đúng option theo id
        vehicle_no: initialValues.vehicle_no,
        freq: initialValues.freq,
        days_of_week: initialValues.days_of_week,
        start_date: initialValues.start_date
          ? dayjs(initialValues.start_date)
          : null,
        end_date: initialValues.end_date ? dayjs(initialValues.end_date) : null,
        depart_hm: initialValues.depart_hm,
        eta_minutes: initialValues.eta_minutes,
        timezone: initialValues.timezone || "Asia/Ho_Chi_Minh",
        status: initialValues.status === "active",
        carriages_json: Array.isArray(initialValues.carriages_json)
          ? initialValues.carriages_json
          : [],
        exceptions_json: initialValues.exceptions_json ?? null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        id: null,
        timezone: "Asia/Ho_Chi_Minh",
        freq: "daily",
        status: true,
        eta_minutes: 180,
        depart_hm: "13:00",
        carriages_json: sampleCarriages,
        exceptions_json: { skip_dates: [], extra: [] },
      });
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    const v = await form.validateFields();
    const idFromForm = v.id ?? initialValues?.id ?? null;

    const payload = {
      route_id: Number(v.route_id), // lấy từ Select
      vehicle_no: v.vehicle_no,
      freq: v.freq,
      days_of_week:
        v.freq === "weekly" ? v.days_of_week || "1,2,3,4,5,6,7" : null,
      start_date: v.start_date
        ? dayjs(v.start_date).format("YYYY-MM-DD")
        : null,
      end_date: v.end_date ? dayjs(v.end_date).format("YYYY-MM-DD") : null,
      depart_hm: v.depart_hm,
      eta_minutes: Number(v.eta_minutes),
      timezone: v.timezone,
      status: v.status ? "active" : "inactive",
      carriages_json: Array.isArray(v.carriages_json) ? v.carriages_json : [],
      exceptions_json: v.exceptions_json || null,
    };

    onSubmit({ id: idFromForm, payload });
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={initialValues ? "Save" : "Create"}
      title={
        initialValues
          ? `Edit Schedule #${initialValues.id}`
          : "New Trip Schedule"
      }
      width={820}
    >
      <Form form={form} layout="vertical">
        {/* giữ id trong form để PUT */}
        <Form.Item name="id" hidden>
          <Input />
        </Form.Item>{" "}
        <Form.Item label="Status" name="status" valuePropName="checked">
          <Switch />
        </Form.Item>
        {/* <Space style={{ display: "flex", justifyContent: "space-between" }}> */}
        {/* Route: Select origin → destination */}
        <Form.Item
          label="Route"
          name="route_id"
          rules={[{ required: true, message: "Please select a route" }]}
        >
          <Select
            placeholder="Select route"
            options={routeOptions}
            loading={routesLoading}
            showSearch
            optionFilterProp="label" // search theo label
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item
          label="Vehicle No"
          name="vehicle_no"
          rules={[{ required: true }]}
        >
          <Input placeholder="e.g. SE1 or S1" />
        </Form.Item>
        {/* </Space> */}
        <Form.Item label="Timezone" name="timezone">
          <Select options={tzOptions} />
        </Form.Item>
        <Form.Item label="Frequency" name="freq" rules={[{ required: true }]}>
          <Select options={freqOptions} />
        </Form.Item>
        <Form.Item
          label="Days of week (weekly)"
          name="days_of_week"
          tooltip="Comma list: 1=Mon ... 7=Sun. Ignore for daily."
        >
          <Input placeholder="1,2,3,4,5,6,7" />
        </Form.Item>
        <Form.Item
          label="Depart HH:mm"
          name="depart_hm"
          rules={[{ required: true }]}
        >
          <Input placeholder="13:00" />
        </Form.Item>
        <Form.Item
          label="ETA minutes"
          name="eta_minutes"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          label="Start date"
          name="start_date"
          rules={[{ required: true }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="End date" name="end_date">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          label="Carriages"
          name="carriages_json"
          rules={[
            {
              validator: (_, v) => {
                if (!Array.isArray(v))
                  return Promise.reject("Carriages must be an array");
                for (const it of v) {
                  if (!it?.seat_template_id)
                    return Promise.reject(
                      "Each carriage needs seat_template_id"
                    );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <CarriagesEditor />
        </Form.Item>
        <Form.Item
          label="Exceptions JSON (optional)"
          name="exceptions_json_text"
          extra='Format: {"skip_dates":["2025-12-31"], "extra":[{"date":"2025-02-01","depart_hm":"14:00"}]}'
          rules={[
            {
              validator: (_, v) => {
                if (!v) return Promise.resolve();
                try {
                  JSON.parse(v);
                  return Promise.resolve();
                } catch {
                  return Promise.reject("Invalid JSON");
                }
              },
            },
          ]}
        >
          <TextArea rows={4} placeholder='{"skip_dates":[],"extra":[]}' />
        </Form.Item>
      </Form>
    </Modal>
  );
}
