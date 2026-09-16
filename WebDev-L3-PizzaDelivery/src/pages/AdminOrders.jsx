import { useEffect, useState } from "react";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const statuses = [
    "Pending",
    "Preparing",
    "Out for Delivery",
    "Delivered",
  ];

  // ==========================================
  // FETCH ALL ORDERS FROM MONGODB
  // ==========================================
    const fetchOrders = async () => {
  try {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("pizzahubToken");

    if (!token) {
      throw new Error("Admin authentication token not found.");
    }

    const response = await fetch(
      "https://pizzahub-1-dxm2.onrender.com/api/orders",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to fetch orders."
      );
    }

    setOrders(data.orders || []);
  } catch (error) {
    console.error("Fetch orders error:", error);

    setError(
      error.message || "Unable to load orders."
    );
  } finally {
    setLoading(false);
  }
};

  // ==========================================
  // UPDATE ORDER STATUS
  // ==========================================

   const updateStatus = async (
  orderId,
  newStatus
) => {
  try {
    setUpdatingId(orderId);
    setError("");

    const token = localStorage.getItem("pizzahubToken");

    if (!token) {
      throw new Error(
        "Admin authentication token not found."
      );
    }

    const response = await fetch(
      `https://pizzahub-1-dxm2.onrender.com/api/orders/${orderId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to update order status."
      );
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.orderId === orderId
          ? {
              ...order,
              status: newStatus,
            }
          : order
      )
    );
  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    setError(
      error.message ||
        "Unable to update order status."
    );
  } finally {
    setUpdatingId(null);
  }
};
  // ==========================================
  // STATUS CSS CLASS
  // ==========================================

  const getStatusClass = (status) => {
    switch (status) {
      case "Preparing":
        return "admin-status preparing";

      case "Out for Delivery":
        return "admin-status delivery";

      case "Delivered":
        return "admin-status delivered";

      default:
        return "admin-status pending";
    }
  };

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  const totalRevenue = orders.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0
  );

  const pendingOrders = orders.filter(
    (order) =>
      (order.status || "Pending") === "Pending"
  ).length;

  const preparingOrders = orders.filter(
    (order) =>
      order.status === "Preparing"
  ).length;

  const deliveredOrders = orders.filter(
    (order) =>
      order.status === "Delivered"
  ).length;

  // ==========================================
  // PAGE UI
  // ==========================================

  return (
    <section
      className="admin-orders"
      id="admin"
    >
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="admin-header">
        <div>
          <span className="admin-label">
            🍕 PIZZAHUB ADMIN
          </span>

          <h1>Order Management</h1>

          <p>
            Manage customer orders, update delivery
            status, and monitor your PizzaHub business.
          </p>
        </div>

        <button
          className="refresh-orders-button"
          onClick={fetchOrders}
          disabled={loading}
        >
          ↻{" "}
          {loading
            ? "Loading..."
            : "Refresh Orders"}
        </button>
      </div>

      {/* ======================================
          ERROR MESSAGE
      ====================================== */}

      {error && (
        <div className="admin-error">
          ⚠️ {error}
        </div>
      )}

      {/* ======================================
          STATISTICS
      ====================================== */}

      <div className="admin-stats">
        {/* Total Orders */}

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            📦
          </div>

          <div>
            <span>TOTAL ORDERS</span>
            <strong>
              {orders.length}
            </strong>
          </div>
        </div>

        {/* Pending */}

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            ⏳
          </div>

          <div>
            <span>PENDING</span>
            <strong>
              {pendingOrders}
            </strong>
          </div>
        </div>

        {/* Preparing */}

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            👨‍🍳
          </div>

          <div>
            <span>PREPARING</span>
            <strong>
              {preparingOrders}
            </strong>
          </div>
        </div>

        {/* Revenue */}

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            💰
          </div>

          <div>
            <span>REVENUE</span>
            <strong>
              ₹{totalRevenue}
            </strong>
          </div>
        </div>
      </div>

      {/* ======================================
          ORDERS CONTENT
      ====================================== */}

      <div className="admin-content">
        <div className="admin-content-header">
          <div>
            <span className="admin-section-label">
              LIVE ORDERS
            </span>

            <h2>Customer Orders</h2>
          </div>

          <div className="admin-order-count">
            {orders.length} order
            {orders.length !== 1
              ? "s"
              : ""}
          </div>
        </div>

        {/* ====================================
            LOADING
        ==================================== */}

        {loading ? (
          <div className="admin-empty">
            <div className="admin-loading-icon">
              🍕
            </div>

            <h3>
              Loading orders...
            </h3>

            <p>
              Please wait while we fetch
              the latest orders.
            </p>
          </div>
        ) : orders.length === 0 ? (
          /* ==================================
             NO ORDERS
          ================================== */

          <div className="admin-empty">
            <div className="admin-loading-icon">
              📦
            </div>

            <h3>
              No orders yet
            </h3>

            <p>
              Customer orders will appear
              here once someone places
              an order.
            </p>
          </div>
        ) : (
          /* ==================================
             ORDERS TABLE
          ================================== */

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>DELIVERY</th>
                  <th>TOTAL</th>
                  <th>STATUS</th>
                  <th>UPDATE</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => {
                  // IMPORTANT:
                  // Use our custom PHxxxxxx order ID.
                  const orderId =
                    order.orderId;

                  const currentStatus =
                    order.status ||
                    "Pending";

                  return (
                    <tr
                      key={orderId}
                    >
                      {/* ==========================
                          ORDER ID
                      ========================== */}

                      <td>
                        <strong className="admin-order-id">
                          #{order.orderId}
                        </strong>
                      </td>

                      {/* ==========================
                          CUSTOMER
                      ========================== */}

                      <td>
                        <div className="admin-customer">
                          <strong>
                            {order.name ||
                              "Customer"}
                          </strong>

                          {order.phone && (
                            <span>
                              {order.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ==========================
                          DELIVERY
                      ========================== */}

                      <td>
                        <div className="admin-address">
                          <strong>
                            {order.city ||
                              "—"}
                          </strong>

                          {order.address && (
                            <span>
                              {order.address}
                            </span>
                          )}

                          {order.pincode && (
                            <small>
                              PIN:{" "}
                              {order.pincode}
                            </small>
                          )}
                        </div>
                      </td>

                      {/* ==========================
                          TOTAL
                      ========================== */}

                      <td>
                        <strong className="admin-total">
                          ₹
                          {Number(
                            order.total || 0
                          )}
                        </strong>
                      </td>

                      {/* ==========================
                          CURRENT STATUS
                      ========================== */}

                      <td>
                        <span
                          className={getStatusClass(
                            currentStatus
                          )}
                        >
                          <span className="status-small-dot"></span>

                          {currentStatus}
                        </span>
                      </td>

                      {/* ==========================
                          STATUS UPDATE
                      ========================== */}

                      <td>
                        <select
                          className="admin-status-select"
                          value={
                            currentStatus
                          }
                          disabled={
                            updatingId ===
                            orderId
                          }
                          onChange={(event) =>
                            updateStatus(
                              orderId,
                              event.target
                                .value
                            )
                          }
                        >
                          {statuses.map(
                            (status) => (
                              <option
                                key={status}
                                value={
                                  status
                                }
                              >
                                {status}
                              </option>
                            )
                          )}
                        </select>

                        {updatingId ===
                          orderId && (
                          <small className="updating-text">
                            Updating...
                          </small>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================
          FOOTER
      ====================================== */}

      <div className="admin-footer-summary">
        <span>
          ✓ {deliveredOrders} delivered
          order
          {deliveredOrders !== 1
            ? "s"
            : ""}
        </span>

        <span>
          PizzaHub Order Management
        </span>
      </div>
    </section>
  );
}

export default AdminOrders;