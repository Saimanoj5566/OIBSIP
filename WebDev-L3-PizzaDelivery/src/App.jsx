import { useState, useEffect } from "react";
import Auth from "./Auth";
import ResetPassword from "./ResetPassword";
import AdminLogin from "./AdminLogin";

import PizzaCard from "./components/PizzaCard";
import PizzaBuilder from "./components/PizzaBuilder";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import OrderConfirmation from "./components/OrderConfirmation";

import AdminOrders from "./pages/AdminOrders";
import AdminInventory from "./pages/AdminInventory";
import TrackOrder from "./pages/TrackOrder";

import pizzaData from "./data/pizzaData";
import pizzaBuilderImage from "./assets/pizza builder.png";

import "./App.css";

function App() {
  const isResetPasswordPage =
  window.location.pathname === "/reset-password";

  const isAdminLoginPage =
  window.location.pathname === "/admin-login";

const isAdminPage =
  window.location.pathname === "/admin";

  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [order, setOrder] = useState(null);
  const [pizzas, setPizzas] = useState([]);
  
  const [currentUser, setCurrentUser] = useState(() => {
  try {
    const savedUser = localStorage.getItem("pizzahubUser");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
});

const [showAuth, setShowAuth] = useState(false);

const handleLoginSuccess = (user) => {
  setCurrentUser(user);
  setShowAuth(false);

  window.scrollTo({
    top: 0,
    behavior: "smooth", 
  });
};

const handleAdminLoginSuccess = (user) => {
  setCurrentUser(user);

  window.history.pushState(
    {},
    "",
    "/admin"
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  window.location.reload();
};

const handleLogout = () => {
  localStorage.removeItem("pizzahubToken");
  localStorage.removeItem("pizzahubUser");

  setCurrentUser(null);
  setShowAuth(false);
};

  // =========================================
  // GET PIZZAS FROM BACKEND
  // =========================================

  useEffect(() => {
    fetch("http://localhost:5000/api/pizzas")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch pizzas");
        }

        return response.json();
      })
      .then((data) => {
        const pizzasFromBackend = data.pizzas || [];

        const pizzasWithImages = pizzasFromBackend.map((pizza) => {
          const localPizza = pizzaData.find(
            (item) => item.id === pizza.id
          );

          return {
            ...pizza,
            image: localPizza?.image,
          };
        });

        setPizzas(pizzasWithImages);
      })
      .catch((error) => {
        console.error("Error fetching pizzas:", error);
      });
  }, []);

  // =========================================
  // ADD PIZZA TO CART
  // =========================================

  const addCustomPizza = (pizza) => {
    setCart((currentCart) => {
      const existingIndex = currentCart.findIndex(
        (item) =>
          (item.id || item._id) ===
          (pizza.id || pizza._id)
      );

      if (existingIndex !== -1) {
        const updatedCart = [...currentCart];

        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity:
            Number(updatedCart[existingIndex].quantity || 1) + 1,
        };

        return updatedCart;
      }

      return [
        ...currentCart,
        {
          ...pizza,
          quantity: 1,
        },
      ];
    });
  };

  // =========================================
  // UPDATE CART QUANTITY
  // =========================================

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      setCart((currentCart) =>
        currentCart.filter(
          (_, itemIndex) => itemIndex !== index
        )
      );

      return;
    }

    setCart((currentCart) =>
      currentCart.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item
      )
    );
  };

  // =========================================
  // REMOVE FROM CART
  // =========================================

  const removeFromCart = (indexToRemove) => {
    setCart((currentCart) =>
      currentCart.filter(
        (_, index) => index !== indexToRemove
      )
    );
  };

  // =========================================
  // OPEN CHECKOUT
  // =========================================

  const openCheckout = () => {
    if (cart.length === 0) {
      alert("Please add a pizza to your cart first.");
      return;
    }

    setShowCheckout(true);

    setTimeout(() => {
      document
        .getElementById("checkout")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  };

  // =========================================
  // BACK TO CART
  // =========================================

  const backToCart = () => {
    setShowCheckout(false);

    setTimeout(() => {
      document
        .getElementById("cart")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  };

  // =========================================
  // PLACE ORDER AFTER PAYMENT
  // =========================================

  const placeOrder = async (
    customerDetails,
    paymentDetails = {}
  ) => {
    const total = cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
          Number(item.quantity || 1),
      0
    );

    const newOrder = {
      id: `PH${Date.now()
        .toString()
        .slice(-6)}`,

      name: customerDetails.name,
      phone: customerDetails.phone,
      address: customerDetails.address,
      city: customerDetails.city,
      pincode: customerDetails.pincode,

      total: total,

      items: [...cart],

      razorpayOrderId:
        paymentDetails.razorpayOrderId || "",

      razorpayPaymentId:
        paymentDetails.razorpayPaymentId || "",

      paymentStatus:
        paymentDetails.paymentStatus || "Pending",
    };

    try {
      const response = await fetch(
        "http://localhost:5000/api/orders",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(newOrder),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to place order"
        );
      }

      console.log(
        "Order saved successfully:",
        data.order
      );

      setOrder(data.order || newOrder);

      setShowCheckout(false);

      setCart([]);

      setTimeout(() => {
        document
          .getElementById("order-confirmation")
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }, 100);
    } catch (error) {
      console.error("Order error:", error);

      alert(
        "Payment was successful, but we could not save the order. Please contact PizzaHub support."
      );
    }
  };

  // =========================================
  // SCROLL HELPER
  // =========================================

  const scrollToSection = (id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  const cartCount = cart.reduce(
    (total, item) =>
      total + Number(item.quantity || 1),
    0
  );

  // =========================================
  // UI
  // =========================================

  if (isResetPasswordPage) {
  return (
    <div className="app">
      <ResetPassword />
    </div>
  );
}

if (isAdminLoginPage) {
  return (
    <div className="app">
      <AdminLogin
        onAdminLoginSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}

if (isAdminPage) {
  const token = localStorage.getItem("pizzahubToken");
  const savedUser = localStorage.getItem("pizzahubUser");

  let adminUser = null;

  try {
    adminUser = savedUser
      ? JSON.parse(savedUser)
      : null;
  } catch {
    adminUser = null;
  }

  if (!token || adminUser?.role !== "admin") {
    window.location.href = "/admin-login";
    return null;
  }

  return (
    <div className="app">
      <section className="admin-dashboard-page">

        <div className="admin-dashboard-header">
          <div>
            <span className="admin-badge">
              PIZZAHUB ADMIN
            </span>

            <h1>Admin Dashboard</h1>

            <p>
              Manage orders, inventory and
              PizzaHub operations.
            </p>
          </div>

          <button
            className="admin-logout-button"
            onClick={() => {
              localStorage.removeItem("pizzahubToken");
              localStorage.removeItem("pizzahubUser");

              setCurrentUser(null);

              window.location.href =
                "/admin-login";
            }}
          >
            Logout
          </button>
        </div>

        <AdminOrders />

        <AdminInventory />

      </section>
    </div>
  );
}

  return (
    <div className="app">

      {showAuth && (
      <Auth
        onLoginSuccess={handleLoginSuccess}
      />
    )}

      {/* =====================================
          PREMIUM NAVBAR
      ===================================== */}

      <header className="navbar">

        <div
          className="brand"
          onClick={() => scrollToSection("home")}
        >
          <div className="brand-icon">
            🍕
          </div>

          <div className="brand-text">
            <span className="brand-pizza">
              Pizza
            </span>

            <span className="brand-hub">
              Hub
            </span>
          </div>
        </div>

        <nav className="desktop-nav">

          <a href="#home">
            Home
          </a>

          <a href="#menu">
            Menu
          </a>

          <a href="#build">
            Build Pizza
          </a>

          <a href="#about">
            About
          </a>

          <a href="#contact">
            Contact
          </a>

          <a href="#track-order">
            Track
          </a>

        </nav>

        {currentUser ? (
  <div className="user-nav-area">
    <span className="user-welcome">
      Hi, {currentUser.name}
    </span>

    <button
      className="nav-auth-btn"
      onClick={handleLogout}
    >
      Logout
    </button>
  </div>
) : (
  <button
    className="nav-auth-btn"
    onClick={() => setShowAuth(true)}
  >
    Login / Register
  </button>
)}

        <button
          className="nav-cart"
          onClick={() => scrollToSection("cart")}
        >
          <span className="nav-cart-icon">
            🛒
          </span>

          <span className="nav-cart-text">
            Cart
          </span>

          <span className="cart-count">
            {cartCount}
          </span>
        </button>

      </header>


      {/* =====================================
          PREMIUM HERO
      ===================================== */}

      <section
        id="home"
        className="hero"
      >

        <div className="hero-background-circle circle-one"></div>
        <div className="hero-background-circle circle-two"></div>

        <div className="hero-content">

          <div className="hero-badge">
            <span>🔥</span>
            FRESH FROM THE OVEN
          </div>

          <h1>
            Crafted with
            <span> passion.</span>
            <br />
            Delivered with
            <span> love.</span>
          </h1>

          <p className="hero-description">
            Experience delicious handcrafted pizzas
            made with premium ingredients, crispy
            crusts and flavours you'll come back for.
          </p>

          <div className="hero-actions">

            <a
              href="#menu"
              className="primary-button"
            >
              <span>Explore Menu</span>
              <strong>→</strong>
            </a>

            <a
              href="#build"
              className="secondary-button"
            >
              <span>🍕</span>
              Build Your Pizza
            </a>

          </div>

          {/* HERO TRUST */}

          <div className="hero-trust">

            <div className="trust-item">

              <div className="trust-icon">
                ⭐
              </div>

              <div>
                <strong>
                  4.9/5
                </strong>

                <small>
                  Customer rating
                </small>
              </div>

            </div>

            <div className="trust-divider"></div>

            <div className="trust-item">

              <div className="trust-icon">
                🚀
              </div>

              <div>
                <strong>
                  Fast Delivery
                </strong>

                <small>
                  Hot & fresh
                </small>
              </div>

            </div>

          </div>

        </div>


        {/* =================================
            HERO VISUAL
        ================================= */}

        <div className="hero-visual">

          <div className="hero-image-glow"></div>

          <div className="hero-pizza-image">

            <img
              src={pizzaBuilderImage}
              alt="Fresh Pizza"
              onError={(event) => {
                event.currentTarget.style.display = "none";
                event.currentTarget.parentElement.classList.add(
                  "image-fallback"
                );
              }}
            />

            <div className="pizza-fallback-content">
              <span>🍕</span>
              <strong>PizzaHub</strong>
              <small>Fresh & handcrafted</small>
            </div>

          </div>


          {/* RATING CARD */}

          <div className="floating-card floating-rating">

            <div className="floating-icon">
              ⭐
            </div>

            <div>
              <strong>
                Premium Taste
              </strong>

              <small>
                Made fresh daily
              </small>
            </div>

          </div>


          {/* HOT CARD */}

          <div className="floating-card floating-delivery">

            <div className="floating-icon">
              🔥
            </div>

            <div>
              <strong>
                Always Hot
              </strong>

              <small>
                Fresh from oven
              </small>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================
          BENEFITS
      ===================================== */}

      <section className="benefits-section">

        <div className="benefit-card">

          <div className="benefit-icon">
            🥬
          </div>

          <div>
            <h3>
              Fresh Ingredients
            </h3>

            <p>
              Quality ingredients in every bite.
            </p>
          </div>

        </div>


        <div className="benefit-card">

          <div className="benefit-icon">
            👨‍🍳
          </div>

          <div>
            <h3>
              Handcrafted
            </h3>

            <p>
              Prepared with care by our kitchen.
            </p>
          </div>

        </div>


        <div className="benefit-card">

          <div className="benefit-icon">
            🔥
          </div>

          <div>
            <h3>
              Freshly Baked
            </h3>

            <p>
              Hot and crispy straight from the oven.
            </p>
          </div>

        </div>


        <div className="benefit-card">

          <div className="benefit-icon">
            🚀
          </div>

          <div>
            <h3>
              Fast Delivery
            </h3>

            <p>
              Fresh pizza delivered to your door.
            </p>
          </div>

        </div>

      </section>


      {/* =====================================
          MENU
      ===================================== */}

      <section
        id="menu"
        className="menu-section"
      >

        <div className="section-heading">

          <div className="section-kicker">
            OUR SPECIAL MENU
          </div>

          <h2>
            Find Your Perfect
            <span> Slice</span>
          </h2>

          <p>
            From timeless classics to bold new
            flavours, there's something for every
            pizza lover.
          </p>

        </div>


        <div className="menu-top-line">

          <span>
            {pizzas.length || 6} delicious choices
          </span>

          <span className="menu-fresh-label">
            ● Made fresh today
          </span>

        </div>


        <div className="pizza-grid">

          {pizzas.length > 0 ? (

            pizzas.map((pizza) => (

              <PizzaCard
                key={pizza.id || pizza._id}
                pizza={pizza}
                onAddToCart={addCustomPizza}
              />

            ))

          ) : (

            <div className="loading-message">

              <span>🍕</span>

              <p>
                Preparing delicious pizzas...
              </p>

            </div>

          )}

        </div>

      </section>


      {/* =====================================
          BUILD YOUR PIZZA
      ===================================== */}

      <section
        id="build"
        className="builder-section"
      >

        <div className="builder-hero">

          <div className="builder-hero-content">

            <span className="builder-eyebrow">
              🍕 CREATE YOUR OWN
            </span>

            <h2>
              Your Pizza.
              <br />
              <span>Your Rules.</span>
            </h2>

            <p>
              Choose your favourite crust, sauce,
              cheese and toppings. Create a pizza
              that's completely yours.
            </p>


            <div className="builder-highlights">

              <span>
                ✓ Choose your crust
              </span>

              <span>
                ✓ Pick your toppings
              </span>

              <span>
                ✓ Made fresh for you
              </span>

            </div>

          </div>


          <div className="builder-hero-image">

            <img
              src={pizzaBuilderImage}
              alt="Build your own pizza"
              onError={(event) => {
                event.currentTarget.style.display = "none";
                event.currentTarget.parentElement.classList.add(
                  "image-fallback"
                );
              }}
            />

            <div className="pizza-fallback-content">
              <span>🍕</span>
              <strong>Build Your Pizza</strong>
              <small>100% your choice</small>
            </div>


            <div className="builder-image-badge">

              <span>
                🍕
              </span>

              <div>
                <strong>
                  100% Custom
                </strong>

                <small>
                  Made your way
                </small>
              </div>

            </div>

          </div>

        </div>


        <div className="section-heading builder-heading">

          <div className="section-kicker">
            STEP INTO THE KITCHEN
          </div>

          <h2>
            Build Your Pizza
          </h2>

          <p>
            Select every ingredient exactly
            the way you want it.
          </p>

        </div>


       <PizzaBuilder
       onAddCustomPizza={addCustomPizza}

        />

      </section>


      {/* =====================================
          CART
      ===================================== */}

      <section
        id="cart"
        className="cart-section"
      >

        <div className="section-heading">

          <div className="section-kicker">
            YOUR SELECTION
          </div>

          <h2>
            Your <span>Cart</span>
          </h2>

          <p>
            Review your delicious choices before
            placing your order.
          </p>

        </div>


        <Cart
          cart={cart}
          onRemoveFromCart={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onCheckout={openCheckout}
        />

      </section>


      {/* =====================================
          CHECKOUT
      ===================================== */}

      {showCheckout && (

        <Checkout
          cart={cart}
          onPlaceOrder={placeOrder}
          onBackToCart={backToCart}
        />

      )}


      {/* =====================================
          ORDER CONFIRMATION
      ===================================== */}

      {order && (

        <section
          id="order-confirmation"
          className="order-confirmation-section"
        >

          <OrderConfirmation
            order={order}
          />

        </section>

      )}


      {/* =====================================
          ABOUT
      ===================================== */}

      <section
        id="about"
        className="about-section"
      >

        <div className="about-content">

          <div className="section-kicker">
            WHY PIZZAHUB
          </div>

          <h2>
            More than pizza.
            <span> It's an experience.</span>
          </h2>

          <p>
            At PizzaHub, we believe great pizza
            starts with great ingredients and ends
            with a smile.
          </p>

          <p>
            Every pizza is prepared fresh, baked
            to perfection and packed with the
            flavours you love.
          </p>

          <a
            href="#menu"
            className="about-button"
          >
            Discover Our Menu
            <span>→</span>
          </a>

        </div>


        <div className="about-features">

          <div className="about-feature-card">

            <span>🌾</span>

            <h3>
              Quality First
            </h3>

            <p>
              Carefully selected ingredients
              for better flavour.
            </p>

          </div>


          <div className="about-feature-card">

            <span>❤️</span>

            <h3>
              Made With Love
            </h3>

            <p>
              Every pizza gets the attention
              it deserves.
            </p>

          </div>


          <div className="about-feature-card">

            <span>🔥</span>

            <h3>
              Fresh & Hot
            </h3>

            <p>
              Baked fresh and served hot
              whenever you order.
            </p>

          </div>


          <div className="about-feature-card">

            <span>✨</span>

            <h3>
              Your Choice
            </h3>

            <p>
              Customize your pizza exactly
              how you like it.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================
          CONTACT
      ===================================== */}

      <section
        id="contact"
        className="contact-section"
      >

        <div className="contact-inner">

          <div className="contact-icon">
            🍕
          </div>

          <div className="section-kicker">
            WE'RE HERE FOR YOU
          </div>

          <h2>
            Hungry? Let's
            <span> talk pizza.</span>
          </h2>

          <p>
            Have a question about your order?
            Need help? Our team is always happy
            to help.
          </p>


          <div className="contact-details">

            <div className="contact-card">

              <span>📧</span>

              <div>

                <small>
                  Email us
                </small>

                <strong>
                  pizzahub@example.com
                </strong>

              </div>

            </div>


            <div className="contact-card">

              <span>🕐</span>

              <div>

                <small>
                  Available
                </small>

                <strong>
                  Every day · 11 AM – 11 PM
                </strong>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================
          TRACK ORDER
      ===================================== */}

      <section
        id="track-order"
        className="track-section-wrapper"
      >

        <TrackOrder />

      </section>


      {/* =====================================
          FOOTER
      ===================================== */}

      <footer className="footer">

        <div className="footer-top">

          <div className="footer-brand">

            <div className="brand">

              <div className="brand-icon">
                🍕
              </div>

              <div className="brand-text">

                <span className="brand-pizza">
                  Pizza
                </span>

                <span className="brand-hub">
                  Hub
                </span>

              </div>

            </div>

            <p>
              Fresh pizza. Bold flavours.
              Made just for you.
            </p>

          </div>


          <div className="footer-links">

            <h4>
              Explore
            </h4>

            <a href="#home">
              Home
            </a>

            <a href="#menu">
              Menu
            </a>

            <a href="#build">
              Build Pizza
            </a>

            <a href="#track-order">
              Track Order
            </a>

          </div>


          <div className="footer-links">

            <h4>
              Support
            </h4>

            <a href="#about">
              About Us
            </a>

            <a href="#contact">
              Contact
            </a>

            <a href="#cart">
              Your Cart
            </a>

          </div>


          <div className="footer-contact">

            <h4>
              PizzaHub
            </h4>

            <p>
              🍕 Made fresh, served hot.
            </p>

            <p>
              📧 pizzahub@example.com
            </p>

          </div>

        </div>


        <div className="footer-bottom">

          <span>
            © 2026 PizzaHub. All rights reserved.
          </span>

          <span>
            Crafted for pizza lovers ❤️
          </span>

        </div>

      </footer>

    </div>
  );
}

export default App;