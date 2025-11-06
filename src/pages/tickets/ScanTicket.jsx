// npm i react-qr-reader@3
import { useEffect, useMemo, useRef, useState } from "react";
import { QrReader } from "react-qr-reader";
import api from "../../api/axios";

export default function ScanTicket() {
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [tripId, setTripId] = useState("");
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const lockRef = useRef(false);

  // --- PREVIEW video refs/stream ---
  const previewRef = useRef(null);
  const previewStreamRef = useRef(null); // để stop tracks khi đổi camera

  // Lấy danh sách camera
  useEffect(() => {
    async function getCams() {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        const cams = all.filter((d) => d.kind === "videoinput");
        setDevices(cams);
        if (!deviceId && cams.length) setDeviceId(cams[0].deviceId);
      } catch (e) {
        setErrorMsg(
          "Không truy cập được camera. Hãy cấp quyền hoặc dùng HTTPS."
        );
      }
    }
    getCams();
  }, []);

  // constraints cho QrReader
  const constraints = useMemo(() => {
    return deviceId
      ? { video: { deviceId: { exact: deviceId } } }
      : { video: { facingMode: "user" } };
  }, [deviceId]);

  // (A) Tìm ticket theo QR (không cần ticket_id)
  const findTicketByQr = async (qr_payload_str) => {
    const { data } = await api.post("/tickets/by-qr", {
      qr_payload: qr_payload_str,
    });
    // server nên trả { message: 'OK', ticket: {...} }
    return data.ticket; // { id, status, ... }
  };

  // (B) Validate (nếu muốn mark USED ngay sau khi tìm thấy)
  const validateTicket = async (ticketId, qr_payload, tripIdOptional) => {
    const { data } = await api.post(`/tickets/${ticketId}/validate`, {
      qr_payload,
      trip_id: tripIdOptional ? Number(tripIdOptional) : undefined,
    });
    return data; // { message, ticket }
  };

  // --- mở stream cho PREVIEW riêng (cùng deviceId) ---
  useEffect(() => {
    let mounted = true;

    async function openPreview() {
      try {
        // dọn stream cũ
        if (previewStreamRef.current) {
          previewStreamRef.current.getTracks().forEach((t) => t.stop());
          previewStreamRef.current = null;
        }

        const stream = await navigator.mediaDevices.getUserMedia(
          deviceId
            ? { video: { deviceId: { exact: deviceId } }, audio: false }
            : { video: { facingMode: "user" }, audio: false }
        );

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        previewStreamRef.current = stream;
        if (previewRef.current) {
          previewRef.current.srcObject = stream;
          await previewRef.current.play();
        }
      } catch (e) {
        // Nếu user chưa grant cho domain này, sẽ lỗi.
        // QrReader vẫn có thể xin quyền riêng; preview sẽ hiện sau khi cấp quyền.
      }
    }

    openPreview();

    return () => {
      mounted = false;
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((t) => t.stop());
        previewStreamRef.current = null;
      }
    };
  }, [deviceId]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h3>Quét vé</h3>

      <div style={{ marginBottom: 8 }}>
        <label>Chọn camera: </label>
        <select
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          disabled={!devices.length}
        >
          {devices.length === 0 && <option>— Không thấy camera —</option>}
          {devices.map((d, i) => (
            <option key={d.deviceId || i} value={d.deviceId}>
              {d.label || `Camera ${i + 1}`}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Trip ID (tùy chọn): </label>
        <input
          placeholder="VD: 80"
          value={tripId}
          onChange={(e) => setTripId(e.target.value)}
        />
      </div>

      {/* Hai cột: Preview video (trái) + QrReader (phải) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* PREVIEW */}
        <div>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Camera Preview</div>
          <video
            ref={previewRef}
            playsInline
            muted
            style={{
              width: "100%",
              aspectRatio: "4 / 3",
              borderRadius: 8,
              background: "#000",
              objectFit: "cover",
            }}
          />
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            (Preview dùng chung camera đang chọn; nếu chưa thấy ảnh, hãy Allow
            camera.)
          </div>
        </div>

        {/* SCANNER */}
        <div>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>QR Scanner</div>
          <div style={{ width: "100%", overflow: "hidden", borderRadius: 8 }}>
            <QrReader
              constraints={constraints}
              onResult={async (res, err) => {
                if (err || !res) return;
                if (lockRef.current) return;
                lockRef.current = true;

                try {
                  const raw = res?.getText?.() || res?.text || "";
                  if (!raw) {
                    lockRef.current = false;
                    return;
                  }

                  //
                  let qr_payload_str = raw;
                  try {
                    const obj = JSON.parse(raw);
                    if (obj && typeof maybeObj === "object") {
                      qr_payload_str = JSON.stringify(obj);
                    }
                  } catch {}

                  // 1) Tìm ticket theo /api/tickets/by-qr
                  const ticket = await findTicketByQr(qr_payload_str); // throws nếu 404
                  setResult({ step: "found", ticket });

                  // 2) Validate luôn
                  const validated = await validateTicket(
                    ticket.id,
                    qr_payload_str,
                    tripId
                  );
                  setResult({ step: "validated", ...validated });
                } catch (e) {
                  const msg =
                    e?.response?.data?.message ||
                    e?.message ||
                    "Xử lý QR thất bại";
                  setResult({ error: true, message: msg });
                } finally {
                  // mở khóa sau 1s để cho quét lại
                  setTimeout(() => (lockRef.current = false), 1000);
                }
              }}
              containerStyle={{ width: "100%" }}
              videoStyle={{
                width: "100%",
                aspectRatio: "4 / 3",
                objectFit: "cover",
              }}
            />
          </div>
          {/* overlay khung scan (tuỳ chọn) */}
          <div
            style={{
              marginTop: 8,
              width: "100%",
              height: 0,
              position: "relative",
              paddingBottom: "0.5rem",
            }}
          >
            <div style={{ fontSize: 12, color: "#666" }}>
              Đưa QR vào giữa khung để quét.
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div style={{ color: "#c00", marginTop: 8 }}>{errorMsg}</div>
      )}

      <div style={{ marginTop: 12 }}>
        {result?.message === "Ticket validated successfully" ? (
          <div style={{ color: "green" }}>
            ✅ Hợp lệ & đã mark USED
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(result.ticket, null, 2)}
            </pre>
          </div>
        ) : result ? (
          <div style={{ color: "crimson" }}>{result.message}</div>
        ) : null}
      </div>

      <div style={{ marginTop: 8, color: "#666", fontSize: 12 }}>
        * Yêu cầu HTTPS (hoặc http://localhost) + cấp quyền camera.
      </div>
    </div>
  );
}
