function OrderConfirmation({ order, onContinueShopping }) {
  return (
    <section className="confirmation-section">

      <div className="confirmation-card">

        {/* SUCCESS ICON */}

        <div className="success-icon">
          ✓
        </div>


        {/* HEADING */}

        <p className="section-label">
          ORDER CONFIRMED
        </p>

        <h2>
          Thank You, {order.name}!
        </h2>

        <p className="confirmation-message">
          Your pizza order has been successfully placed.
          We're getting it ready for you!
        </p>


        {/* ORDER STATUS */}

        <div className="order-status-badge">
          <span className="status-dot"></span>
          Order Received
        </div>


        {/* ORDER DETAILS */}

        <div className="order-details">

          <div className="order-detail-item">

            <span>ORDER ID</span>

            <strong>
              {order.id}
            </strong>

          </div>


          <div className="order-detail-item">

            <span>TOTAL AMOUNT</span>

            <strong>
              ₹{order.total}
            </strong>

          </div>


          <div className="order-detail-item">

            <span>DELIVERY TO</span>

            <strong>
              {order.city}
            </strong>

          </div>

        </div>


        {/* NEXT STEPS */}

        <div className="confirmation-next">

          <div className="next-icon">
            🍕
          </div>

          <div>
            <strong>
              Your order is being prepared
            </strong>

            <p>
              We'll prepare your pizza fresh and get it
              delivered to you as quickly as possible.
            </p>
          </div>

        </div>


        {/* BUTTON */}

        <button
          className="continue-shopping-button"
          onClick={onContinueShopping}
        >
          Continue Shopping
          <span>→</span>
        </button>


        {/* FOOTER */}

        <p className="confirmation-footer">
          Thank you for choosing PizzaHub ❤️
        </p>

      </div>

    </section>
  );
}

export default OrderConfirmation;