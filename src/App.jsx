import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import UsersList from "./pages/users/UsersList.jsx";
import RoutesList from "./pages/routes/RouteList.jsx";
import TripsList from "./pages/trips/TripsList.jsx";
import SeatTemplatesList from "./pages/seat_templates/SeatTemplatesList.jsx";
import SeatMapEditor from "./pages/seat_templates/SeatMapEditor.jsx"; // bạn đã có
import OrdersList from "./pages/orders/OrdersList.jsx";
import OrderDetail from "./pages/orders/OrderDetail.jsx";
import SeatMapByCarriage from "./pages/trips/SeatMapByCarriage.jsx";
// import PaymentsList from "./pages/payments/PaymentsList";
import TicketsList from "./pages/tickets/TicketsList.jsx";
import TicketDetail from "./pages/tickets/TicketDetail.jsx";
// import SupportList from "./pages/support/SupportList";
// import NotificationsList from "./pages/notifications/NotificationsList";
import TripSchedulesList from "./pages/schedules/TripSchedulesList.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout>
                <UsersList />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/routes"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout>
                <RoutesList />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout>
                <TripsList />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:id/seatmap-by-carriage"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout>
                <SeatMapByCarriage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/seat-templates"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout>
                <SeatTemplatesList />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seat-templates/:id/seatmap"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout>
                <SeatMapEditor />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout>
                <OrdersList />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout>
                <OrderDetail />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        {/* <Route
          path="/payments"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout>
                <PaymentsList />
              </AdminLayout>
            </ProtectedRoute>
          }
        /> */}
        <Route
          path="/tickets"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout>
                <TicketsList />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tickets/:id"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout>
                <TicketDetail />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        {/*
        <Route
          path="/support"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout>
                <SupportList />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout>
                <NotificationsList />
              </AdminLayout>
            </ProtectedRoute>
          }
        /> */}
        <Route
          path="/trip-schedules"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout>
                <TripSchedulesList />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
