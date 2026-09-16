import { useState } from "react";

function Checkout({ cart, onBackToCart, onPlaceOrder }) {
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // =========================================
  // ORDER TOTALS
  // =========================================

  const total = cart.reduce((sum, item) => {
    const price = Number(item.price || 0);
    const quantity = Number(item.quantity || 1);

    return sum + price * quantity;
  }, 0);

  const totalItems = cart.reduce((sum, item) => {
    return sum + Number(item.quantity || 1);
  }, 0);

  // =========================================
  // HANDLE INPUT
  // =========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setCustomer((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================================
  // HANDLE PAYMENT
  // =========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedCustomer = {
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      address: customer.address.trim(),
      city: customer.city.trim(),
      pincode: customer.pincode.trim(),
    };

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !trimmedCustomer.name ||
      !trimmedCustomer.phone ||
      !trimmedCustomer.address ||
      !trimmedCustomer.city ||
      !trimmedCustomer.pincode
    ) {
      alert("Please fill in all delivery details.");
      return;
    }

    if (!/^[0-9]{10}$/.test(trimmedCustomer.phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!/^[0-9]{6}$/.test(trimmedCustomer.pincode)) {
      alert("Please enter a valid 6-digit pincode.");
      return;
    }

    if (!cart || cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (total <= 0) {
      alert("Invalid order amount.");
      return;
    }

    try {
      setIsProcessing(true);

      // =========================================
      // CHECK RAZORPAY SCRIPT
      // =========================================

      if (!window.Razorpay) {
        console.error(
          "❌ Razorpay checkout script is not loaded."
        );

        alert(
          "Razorpay could not be loaded. Please refresh the page and try again."
        );

        setIsProcessing(false);
        return;
      }

      // =========================================
      // CREATE RAZORPAY ORDER
      // =========================================

      console.log("Creating Razorpay order...");
      console.log("Payment amount:", total);

      const response = await fetch(
        "https://pizzahub-1-dxm2.onrender.com/api/payment/create-order",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            amount: total,
          }),
        }
      );

      // =========================================
      // READ BACKEND RESPONSE
      // =========================================

      const data = await response.json();

      console.log("=================================");
      console.log("RAZORPAY BACKEND RESPONSE");
      console.log("=================================");
      console.log(data);
      console.log("Response status:", response.status);
      console.log("Response success:", data.success);
      console.log("Response keyId:", data.keyId);
      console.log("Response key_id:", data.key_id);
      console.log("Response order:", data.order);

      // =========================================
      // CHECK HTTP RESPONSE
      // =========================================

      if (!response.ok) {
        throw new Error(
          data.message ||
            "The payment server returned an error."
        );
      }

      // =========================================
      // CHECK SUCCESS
      // =========================================

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to create Razorpay payment order."
        );
      }

      // =========================================
      // CHECK ORDER
      // =========================================

      if (!data.order) {
        console.error(
          "❌ Razorpay order missing:",
          data
        );

        throw new Error(
          "Razorpay order was not returned by the server."
        );
      }

      if (!data.order.id) {
        console.error(
          "❌ Razorpay order ID missing:",
          data.order
        );

        throw new Error(
          "Razorpay order ID is missing."
        );
      }

      // =========================================
      // GET RAZORPAY PUBLIC KEY
      // =========================================
      //
      // Accept multiple possible backend names.
      // These are PUBLIC key IDs only.
      // =========================================

      const razorpayKey =
        data.keyId ||
        data.key_id ||
        data.razorpayKeyId ||
        data.razorpay_key_id ||
        data.key ||
        "";

      console.log(
        "Razorpay key received:",
        razorpayKey ? "YES" : "NO"
      );

      // =========================================
      // CHECK RAZORPAY KEY
      // =========================================

      if (!razorpayKey) {
        console.error(
          "❌ Razorpay public key is missing.",
          {
            success: data.success,
            keyId: data.keyId,
            key_id: data.key_id,
            order: data.order,
          }
        );

        throw new Error(
          "Razorpay public Key ID was not returned by the server."
        );
      }

      // =========================================
      // RAZORPAY OPTIONS
      // =========================================

      const options = {
        key: razorpayKey,

        amount: Number(data.order.amount),

        currency: data.order.currency || "INR",

        name: "PizzaHub",

        description: "Fresh Pizza Delivery",

        order_id: data.order.id,

        prefill: {
          name: trimmedCustomer.name,
          contact: trimmedCustomer.phone,
        },

        notes: {
          address: trimmedCustomer.address,
          city: trimmedCustomer.city,
          pincode: trimmedCustomer.pincode,
        },

        theme: {
          color: "#111827",
        },

        // =========================================
        // PAYMENT SUCCESS
        // =========================================

        handler: async function (paymentResponse) {
          console.log(
            "Razorpay payment response:",
            paymentResponse
          );

          try {
            if (
              !paymentResponse ||
              !paymentResponse.razorpay_order_id ||
              !paymentResponse.razorpay_payment_id ||
              !paymentResponse.razorpay_signature
            ) {
              throw new Error(
                "Invalid payment response received from Razorpay."
              );
            }

            // =====================================
            // VERIFY PAYMENT
            // =====================================

            console.log(
              "Verifying payment on backend..."
            );

            const verifyResponse = await fetch(
              "https://pizzahub-1-dxm2.onrender.com/api/payment/verify",
              {
                method: "POST",

                headers: {
                  "Content-Type": "application/json",
                },

                body: JSON.stringify({
                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,

                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,

                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                }),
              }
            );

            const verifyData =
              await verifyResponse.json();

            console.log(
              "Payment verification response:",
              verifyData
            );

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.message ||
                  "Payment verification request failed."
              );
            }

            if (!verifyData.success) {
              throw new Error(
                verifyData.message ||
                  "Payment verification failed."
              );
            }

            // =====================================
            // PAYMENT VERIFIED
            // =====================================

            console.log(
              "✅ Payment verified successfully:",
              paymentResponse.razorpay_payment_id
            );

            alert(
              "Payment successful! Your order is being placed."
            );

            // =====================================
            // SAVE ORDER
            // =====================================

            onPlaceOrder(trimmedCustomer, {
              razorpayOrderId:
                paymentResponse.razorpay_order_id,

              razorpayPaymentId:
                paymentResponse.razorpay_payment_id,

              paymentStatus: "Paid",
            });
          } catch (error) {
            console.error(
              "❌ Payment verification error:",
              error
            );

            alert(
              error.message ||
                "Payment verification failed. Please contact support."
            );

            setIsProcessing(false);
          }
        },

        // =========================================
        // PAYMENT WINDOW CLOSED
        // =========================================

        modal: {
          ondismiss: function () {
            console.log(
              "Razorpay payment window closed."
            );

            setIsProcessing(false);

            alert(
              "Payment was cancelled. Your order has not been placed."
            );
          },
        },
      };

      // =========================================
      // CREATE RAZORPAY INSTANCE
      // =========================================

      console.log(
        "Opening Razorpay checkout..."
      );

      const razorpay =
        new window.Razorpay(options);

      // =========================================
      // PAYMENT FAILED
      // =========================================

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "❌ Razorpay payment failed:",
            response
          );

          setIsProcessing(false);

          const description =
            response?.error?.description ||
            "Payment failed. Please try again.";

          alert(description);
        }
      );

      // =========================================
      // OPEN RAZORPAY
      // =========================================

      razorpay.open();
    } catch (error) {
      console.error(
        "❌ Payment initialization error:",
        error
      );

      alert(
        error.message ||
          "Unable to start payment. Please try again."
      );

      setIsProcessing(false);
    }
  };

  // =========================================
  // UI
  // =========================================

  return (
    <section
      className="checkout-section"
      id="checkout"
    >
      {/* =====================================
          SECTION HEADING
      ====================================== */}

      <div className="section-heading">
        <p>SECURE CHECKOUT</p>

        <h2>Complete Your Order</h2>

        <span>
          Enter your delivery details and get
          your favorite pizza on the way.
        </span>
      </div>

      <div className="checkout-container">

        {/* ===================================
            DELIVERY FORM
        ==================================== */}

        <form
          className="checkout-form"
          onSubmit={handleSubmit}
        >
          <div className="checkout-form-header">
            <div className="checkout-icon">
              📍
            </div>

            <div>
              <h3>Delivery Details</h3>

              <p>
                Tell us where you'd like your
                order delivered.
              </p>
            </div>
          </div>

          {/* NAME */}

          <label>
            <span>Full Name</span>

            <input
              type="text"
              name="name"
              value={customer.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
            />
          </label>

          {/* PHONE */}

          <label>
            <span>Phone Number</span>

            <input
              type="tel"
              name="phone"
              value={customer.phone}
              onChange={handleChange}
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
              inputMode="numeric"
              autoComplete="tel"
            />
          </label>

          {/* ADDRESS */}

          <label>
            <span>Delivery Address</span>

            <textarea
              name="address"
              value={customer.address}
              onChange={handleChange}
              placeholder="House / Flat No., Street, Area"
              rows={4}
              autoComplete="street-address"
            />
          </label>

          {/* CITY + PINCODE */}

          <div className="checkout-row">

            <label>
              <span>City</span>

              <input
                type="text"
                name="city"
                value={customer.city}
                onChange={handleChange}
                placeholder="Hyderabad"
                autoComplete="address-level2"
              />
            </label>

            <label>
              <span>Pincode</span>

              <input
                type="text"
                name="pincode"
                value={customer.pincode}
                onChange={handleChange}
                placeholder="500001"
                maxLength={6}
                inputMode="numeric"
                autoComplete="postal-code"
              />
            </label>

          </div>

          {/* SECURITY MESSAGE */}

          <div className="checkout-security">
            <span>🔒</span>

            <p>
              Your payment is securely
              processed by Razorpay.
            </p>
          </div>

          {/* PAYMENT BUTTON */}

          <button
            type="submit"
            className="place-order-button"
            disabled={isProcessing}
          >
            <span>
              {isProcessing
                ? "Processing Payment..."
                : `Pay ₹${total}`}
            </span>

            <span className="place-order-arrow">
              {isProcessing ? "⏳" : "→"}
            </span>
          </button>

          {/* BACK TO CART */}

          <button
            type="button"
            className="back-cart-button"
            onClick={onBackToCart}
            disabled={isProcessing}
          >
            ← Back to Cart
          </button>

        </form>

        {/* ===================================
            ORDER SUMMARY
        ==================================== */}

        <div className="checkout-summary">

          <div className="checkout-summary-header">

            <div>
              <span>YOUR ORDER</span>

              <h3>Order Summary</h3>
            </div>

            <strong>
              {totalItems} item
              {totalItems !== 1 ? "s" : ""}
            </strong>

          </div>

          {/* ITEMS */}

          <div className="checkout-items">

            {cart.map((item, index) => {
              const quantity = Number(
                item.quantity || 1
              );

              const price = Number(
                item.price || 0
              );

              const itemTotal =
                price * quantity;

              return (
                <div
                  className="checkout-item"
                  key={`${
                    item.id ||
                    item._id ||
                    item.name
                  }-${index}`}
                >
                  <div className="checkout-item-image">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                      />
                    ) : (
                      <span>🍕</span>
                    )}
                  </div>

                  <div className="checkout-item-info">
                    <h4>{item.name}</h4>

                    <span>
                      ₹{price} × {quantity}
                    </span>
                  </div>

                  <strong className="checkout-item-total">
                    ₹{itemTotal}
                  </strong>
                </div>
              );
            })}

          </div>

          {/* PRICE DETAILS */}

          <div className="checkout-price-details">

            <div>
              <span>Subtotal</span>

              <strong>
                ₹{total}
              </strong>
            </div>

            <div>
              <span>Delivery</span>

              <strong className="free-delivery">
                FREE
              </strong>
            </div>

          </div>

          {/* TOTAL */}

          <div className="checkout-total">

            <span>Total Amount</span>

            <strong>
              ₹{total}
            </strong>

          </div>

          {/* PAYMENT METHOD */}

          <div className="payment-info">

            <div className="payment-icon">
              💳
            </div>

            <div>
              <strong>
                Payment Method
              </strong>

              <p>
                Secure Online Payment ·
                Razorpay
              </p>
            </div>

          </div>

          {/* TRUST MESSAGE */}

          <div className="checkout-trust">

            <span>✓</span>

            <p>
              Your payment is securely
              verified before your order
              is saved.
            </p>

          </div>

        </div>
      </div>
    </section>
  );
}

export default Checkout;