import { useState } from "react";

function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const statuses = [
    "Pending",
    "Preparing",
    "Out for Delivery",
    "Delivered",
  ];

  // ==========================================
  // TRACK ORDER
  // ==========================================

  const trackOrder = async () => {
    const enteredOrderId = orderId.trim().toUpperCase();

    if (!enteredOrderId) {
      setError("Please enter your Order ID.");
      setOrder(null);
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/orders/${enteredOrderId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Order not found"
        );
      }

      // Backend returns { success: true, order: {...} }
      setOrder(data.order);
    } catch (error) {
      console.error("Track order error:", error);

      setError(
        error.message ||
          "Unable to find your order."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ENTER KEY
  // ==========================================

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      trackOrder();
    }
  };

  const currentStatus =
    order?.status || "Pending";

  const currentStep =
    statuses.indexOf(currentStatus);

  // ==========================================
  // STATUS MESSAGE
  // ==========================================

  const getStatusMessage = () => {
    switch (currentStatus) {
      case "Pending":
        return "Your order has been received and is waiting to be prepared.";

      case "Preparing":
        return "Our chefs are preparing your pizza fresh for you.";

      case "Out for Delivery":
        return "Your pizza is on the way. It will reach you soon!";

      case "Delivered":
        return "Your order has been delivered. Enjoy your pizza! 🍕";

      default:
        return "Your order is being processed.";
    }
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <section
      className="track-order"
      id="track"
    >
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="track-header">
        <span className="track-label">
          🍕 PIZZAHUB
        </span>

        <h1>Track Your Order</h1>

        <p>
          Enter your Order ID below and follow
          your pizza from our kitchen to your
          doorstep.
        </p>
      </div>

      {/* ======================================
          SEARCH
      ====================================== */}

      <div className="track-search">
        <div className="track-input-wrapper">
          <span>🔎</span>

          <input
            type="text"
            placeholder="Enter Order ID e.g. PH249972"
            value={orderId}
            onChange={(event) =>
              setOrderId(
                event.target.value.toUpperCase()
              )
            }
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>

        <button
          onClick={trackOrder}
          disabled={loading}
        >
          {loading
            ? "Checking..."
            : "Track Order"}

          {!loading && <span>→</span>}
        </button>
      </div>

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="track-error">
          ⚠️ {error}
        </div>
      )}

      {/* ======================================
          ORDER DETAILS
      ====================================== */}

      {order && (
        <div className="tracked-order">

          {/* ==================================
              ORDER HEADER
          ================================== */}

          <div className="tracked-order-top">
            <div>
              <span className="tracked-label">
                ORDER DETAILS
              </span>

              <h2>
                #{order.orderId}
              </h2>
            </div>

            <div className="status-badge">
              <span></span>
              {currentStatus}
            </div>
          </div>

          {/* ==================================
              CUSTOMER SUMMARY
          ================================== */}

          <div className="customer-summary">

            <div className="summary-box">
              <span>CUSTOMER</span>

              <strong>
                {order.name ||
                  "Customer"}
              </strong>
            </div>

            <div className="summary-box">
              <span>TOTAL AMOUNT</span>

              <strong>
                ₹{Number(order.total || 0)}
              </strong>
            </div>

            {order.city && (
              <div className="summary-box">
                <span>
                  DELIVERY CITY
                </span>

                <strong>
                  {order.city}
                </strong>
              </div>
            )}
          </div>

          {/* ==================================
              ORDER PROGRESS
          ================================== */}

          <div className="tracking-status">
            <span className="tracked-label">
              ORDER PROGRESS
            </span>

            <h3>
              {currentStatus ===
              "Delivered"
                ? "Your pizza has arrived! 🍕"
                : "Your pizza is on its way to you"}
            </h3>

            <div className="tracking-progress">
              {statuses.map(
                (status, index) => {
                  const isActive =
                    index <= currentStep;

                  return (
                    <div
                      key={status}
                      className={`tracking-step ${
                        isActive
                          ? "active"
                          : ""
                      }`}
                    >
                      <div className="step-circle">
                        {isActive
                          ? "✓"
                          : index + 1}
                      </div>

                      <p>{status}</p>

                      {index <
                        statuses.length -
                          1 && (
                        <div
                          className={`step-line ${
                            index <
                            currentStep
                              ? "active"
                              : ""
                          }`}
                        ></div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* ==================================
              CURRENT STATUS
          ================================== */}

          <div className="current-status-card">
            <div className="current-status-icon">
              🍕
            </div>

            <div>
              <span>
                CURRENT STATUS
              </span>

              <strong>
                {currentStatus}
              </strong>

              <p>
                {getStatusMessage()}
              </p>
            </div>
          </div>

          {/* ==================================
              DELIVERY INFORMATION
          ================================== */}

          {order.address && (
            <div className="current-status-card">
              <div className="current-status-icon">
                📍
              </div>

              <div>
                <span>
                  DELIVERY ADDRESS
                </span>

                <strong>
                  {order.city}
                </strong>

                <p>
                  {order.address}
                  {order.pincode &&
                    ` - ${order.pincode}`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default TrackOrder;