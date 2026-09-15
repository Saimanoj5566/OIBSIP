function Cart({
  cart,
  onRemoveFromCart,
  onUpdateQuantity,
  onCheckout,
}) {
  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  return (
    <section className="cart-section" id="cart">

      <div className="section-heading">
        <p>YOUR ORDER</p>

        <h2>Shopping Cart</h2>

        <span>
          Review your delicious choices before checkout.
        </span>
      </div>

      {cart.length === 0 ? (

        <div className="empty-cart">

          <div className="empty-cart-icon">
            🛒
          </div>

          <h3>Your cart is empty</h3>

          <p>
            Your perfect pizza is waiting for you.
            <br />
            Add something delicious from our menu.
          </p>

          <a
            href="#menu"
            className="browse-menu-button"
          >
            Browse Menu
          </a>

        </div>

      ) : (

        <div className="cart-container">

          {/* CART ITEMS */}

          <div className="cart-items">

            <div className="cart-items-header">

              <h3>Your Pizzas</h3>

              <span>
                {cart.length} item
                {cart.length > 1 ? "s" : ""}
              </span>

            </div>

            {cart.map((item, index) => (

              <div
                className="cart-item"
                key={`${item.id || item.name}-${index}`}
              >

                {/* IMAGE */}

                <div className="cart-item-image">

                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                    />
                  ) : (
                    <span>🍕</span>
                  )}

                </div>

                {/* INFORMATION */}

                <div className="cart-item-info">

                  <span className="cart-item-category">
                    {item.category || "PIZZA"}
                  </span>

                  <h3>{item.name}</h3>

                  {item.base && (
                    <p className="pizza-customization">
                      {item.base} • {item.sauce} • {item.cheese}
                    </p>
                  )}

                  {item.vegetables?.length > 0 && (
                    <p className="pizza-customization">
                      <strong>Veggies:</strong>{" "}
                      {item.vegetables.join(", ")}
                    </p>
                  )}

                  <strong className="cart-item-price">
                    ₹{item.price}
                  </strong>

                </div>

                {/* QUANTITY */}

                <div className="quantity-control">

                  <button
                    onClick={() =>
                      onUpdateQuantity(
                        index,
                        Number(item.quantity || 1) - 1
                      )
                    }
                  >
                    −
                  </button>

                  <span>
                    {item.quantity || 1}
                  </span>

                  <button
                    onClick={() =>
                      onUpdateQuantity(
                        index,
                        Number(item.quantity || 1) + 1
                      )
                    }
                  >
                    +
                  </button>

                </div>

                {/* REMOVE */}

                <button
                  className="remove-button"
                  onClick={() =>
                    onRemoveFromCart(index)
                  }
                >
                  ✕ Remove
                </button>

              </div>

            ))}

          </div>

          {/* ORDER SUMMARY */}

          <div className="cart-summary">

            <div className="summary-top">

              <span>ORDER SUMMARY</span>

              <h3>Your Total</h3>

            </div>

            <div className="summary-row">

              <span>Items</span>

              <span>
                {cart.reduce(
                  (sum, item) =>
                    sum + Number(item.quantity || 1),
                  0
                )}
              </span>

            </div>

            <div className="summary-row">

              <span>Subtotal</span>

              <span>
                ₹{total}
              </span>

            </div>

            <div className="summary-row">

              <span>Delivery</span>

              <span className="free-delivery">
                FREE
              </span>

            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">

              <span>Total</span>

              <strong>
                ₹{total}
              </strong>

            </div>

            <button
              className="checkout-button"
              onClick={onCheckout}
            >
              Proceed to Checkout
              <span>→</span>
            </button>

            <p className="secure-checkout">
              🔒 Secure checkout • Freshly prepared
            </p>

          </div>

        </div>

      )}

    </section>
  );
}

export default Cart;