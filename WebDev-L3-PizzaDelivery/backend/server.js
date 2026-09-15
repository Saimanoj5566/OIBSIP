// ==========================================
// PIZZAHUB BACKEND SERVER
// ==========================================

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

const connectDB = require("./config/db");
const Order = require("./models/Order");
const Inventory = require("./models/Inventory");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==========================================
// INVENTORY DEDUCTION HELPER
// ==========================================

const deductInventoryForOrder = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  // ==========================================
  // STANDARD PIZZA RECIPES
  // ==========================================

  const pizzaRecipes = {
    Margherita: [
      {
        name: "Classic Hand Tossed",
        category: "Pizza Base",
        quantity: 1,
      },
      {
        name: "Tomato",
        category: "Sauce",
        quantity: 1,
      },
      {
        name: "Mozzarella",
        category: "Cheese",
        quantity: 1,
      },
    ],

    Farmhouse: [
      {
        name: "Classic Hand Tossed",
        category: "Pizza Base",
        quantity: 1,
      },
      {
        name: "Tomato",
        category: "Sauce",
        quantity: 1,
      },
      {
        name: "Mozzarella",
        category: "Cheese",
        quantity: 1,
      },
      {
        name: "Onion",
        category: "Vegetable",
        quantity: 1,
      },
      {
        name: "Capsicum",
        category: "Vegetable",
        quantity: 1,
      },
      {
        name: "Tomato",
        category: "Vegetable",
        quantity: 1,
      },
    ],

    Pepperoni: [
      {
        name: "Classic Hand Tossed",
        category: "Pizza Base",
        quantity: 1,
      },
      {
        name: "Tomato",
        category: "Sauce",
        quantity: 1,
      },
      {
        name: "Mozzarella",
        category: "Cheese",
        quantity: 1,
      },
    ],

    "Veggie Delight": [
      {
        name: "Classic Hand Tossed",
        category: "Pizza Base",
        quantity: 1,
      },
      {
        name: "Tomato",
        category: "Sauce",
        quantity: 1,
      },
      {
        name: "Mozzarella",
        category: "Cheese",
        quantity: 1,
      },
      {
        name: "Onion",
        category: "Vegetable",
        quantity: 1,
      },
      {
        name: "Capsicum",
        category: "Vegetable",
        quantity: 1,
      },
      {
        name: "Tomato",
        category: "Vegetable",
        quantity: 1,
      },
    ],

    "Chicken Tikka": [
      {
        name: "Classic Hand Tossed",
        category: "Pizza Base",
        quantity: 1,
      },
      {
        name: "Tomato",
        category: "Sauce",
        quantity: 1,
      },
      {
        name: "Mozzarella",
        category: "Cheese",
        quantity: 1,
      },
      {
        name: "Onion",
        category: "Vegetable",
        quantity: 1,
      },
    ],

    "Cheese Burst": [
      {
        name: "Cheese Burst",
        category: "Pizza Base",
        quantity: 1,
      },
      {
        name: "Tomato",
        category: "Sauce",
        quantity: 1,
      },
      {
        name: "Mozzarella",
        category: "Cheese",
        quantity: 2,
      },
    ],
  };

  // ==========================================
  // CUSTOM PIZZA SAUCE MAPPING
  // ==========================================

  const sauceMap = {
    "Classic Tomato": "Tomato",
    "Spicy Peri Peri": "Peri Peri",
    "Creamy Garlic": "Garlic",
    "BBQ Sauce": "BBQ",
    "Pesto Sauce": "Pesto",
  };

  // ==========================================
  // CALCULATE TOTAL REQUIREMENTS
  // ==========================================

  const requirements = new Map();

  const addRequirement = (
    name,
    category,
    quantity
  ) => {
    if (
      !name ||
      !category ||
      quantity <= 0
    ) {
      return;
    }

    const key =
      `${category}::${name}`;

    const current =
      requirements.get(key) || {
        name,
        category,
        quantity: 0,
      };

    current.quantity += quantity;

    requirements.set(
      key,
      current
    );
  };

  // ==========================================
  // PROCESS ORDER ITEMS
  // ==========================================

  for (const item of items) {
    const quantity =
      Number(item.quantity || 1);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      continue;
    }

    let recipe =
      pizzaRecipes[item.name];

    // ========================================
    // CUSTOM PIZZA
    // ========================================

    if (
      item.name === "Custom Pizza"
    ) {
      recipe = [
        {
          name: item.base,
          category: "Pizza Base",
          quantity: 1,
        },

        {
          name:
            sauceMap[item.sauce] ||
            item.sauce,
          category: "Sauce",
          quantity: 1,
        },

        {
          name: item.cheese,
          category: "Cheese",
          quantity: 1,
        },

        ...(Array.isArray(
          item.vegetables
        )
          ? item.vegetables.map(
              (vegetable) => ({
                name: vegetable,
                category:
                  "Vegetable",
                quantity: 1,
              })
            )
          : []),
      ];
    }

    // ========================================
    // RECIPE NOT FOUND
    // ========================================

    if (!recipe) {
      console.log(
        `No inventory recipe found for: ${item.name}`
      );

      continue;
    }

    // ========================================
    // ADD INGREDIENT REQUIREMENTS
    // ========================================

    for (const ingredient of recipe) {
      addRequirement(
        ingredient.name,
        ingredient.category,
        ingredient.quantity *
          quantity
      );
    }
  }

  // ==========================================
  // CHECK STOCK BEFORE DEDUCTING ANYTHING
  // ==========================================

  const inventoryItems = [];

  for (
    const requirement of
      requirements.values()
  ) {
    const inventoryItem =
      await Inventory.findOne({
        name: requirement.name,
        category:
          requirement.category,
      });

    if (!inventoryItem) {
      throw new Error(
        `Inventory item not found: ${requirement.name} (${requirement.category}).`
      );
    }

    if (
      inventoryItem.stock <
      requirement.quantity
    ) {
      throw new Error(
        `Insufficient stock for ${requirement.name}. Available: ${inventoryItem.stock}, required: ${requirement.quantity}.`
      );
    }

    inventoryItems.push({
      inventoryItem,
      requirement,
    });
  }

  // ==========================================
  // DEDUCT INVENTORY
  // ==========================================

  const deductedItems = [];

  try {
    for (
      const {
        inventoryItem,
        requirement,
      } of inventoryItems
    ) {
      inventoryItem.stock -=
        requirement.quantity;

      await inventoryItem.save();

      deductedItems.push({
        id: inventoryItem._id,
        quantity:
          requirement.quantity,
      });

      console.log(
        `Inventory updated: ${requirement.name} -${requirement.quantity} ${inventoryItem.unit}. Remaining: ${inventoryItem.stock}`
      );
    }
  } catch (error) {
    // Restore anything already deducted
    for (
      const deducted of deductedItems
    ) {
      await Inventory.findByIdAndUpdate(
        deducted.id,
        {
          $inc: {
            stock:
              deducted.quantity,
          },
        }
      );
    }

    throw error;
  }

  return deductedItems;
};

// ==========================================
// RESTORE INVENTORY
// ==========================================

const restoreInventory = async (
  deductedItems
) => {
  if (
    !Array.isArray(
      deductedItems
    ) ||
    deductedItems.length === 0
  ) {
    return;
  }

  for (
    const item of deductedItems
  ) {
    await Inventory.findByIdAndUpdate(
      item.id,
      {
        $inc: {
          stock: item.quantity,
        },
      }
    );
  }
};

// ==========================================
// LOAD ENVIRONMENT VARIABLES
// ==========================================

dotenv.config();

// ==========================================
// EMAIL CONFIGURATION
// ==========================================

const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: 
    
    process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// =========================================================
// LOW STOCK EMAIL ALERT
// =========================================================

const checkLowStockAndSendEmail = async () => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: {
        $lte: ["$stock", "$threshold"],
      },
    }).sort({
      category: 1,
      name: 1,
    });

    if (lowStockItems.length === 0) {
      console.log("Low-stock check: All inventory levels are healthy.");
      return;
    }

    const itemRows = lowStockItems
      .map(
        (item) => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;">
              ${item.name}
            </td>
            <td style="padding:10px;border-bottom:1px solid #eee;">
              ${item.category}
            </td>
            <td style="padding:10px;border-bottom:1px solid #eee;color:#d90429;font-weight:bold;">
              ${item.stock} ${item.unit}
            </td>
            <td style="padding:10px;border-bottom:1px solid #eee;">
              ${item.threshold} ${item.unit}
            </td>
          </tr>
        `
      )
      .join("");

    await emailTransporter.sendMail({
      from: `"PizzaHub" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_FROM,
      subject: "⚠️ PizzaHub Low Stock Alert",
      html: `
        <div style="
          font-family:Arial,sans-serif;
          max-width:700px;
          margin:30px auto;
          padding:30px;
          background:#fff8f6;
          border-radius:16px;
          border:1px solid #f3d8d2;
        ">

          <h1 style="color:#d90429;">
            🍕 PizzaHub Inventory Alert
          </h1>

          <p style="font-size:16px;color:#444;">
            The following inventory items have reached or fallen
            below their configured stock threshold.
          </p>

          <table style="
            width:100%;
            border-collapse:collapse;
            background:white;
            margin-top:20px;
          ">
            <thead>
              <tr style="background:#ffe8e4;">
                <th style="padding:12px;text-align:left;">Item</th>
                <th style="padding:12px;text-align:left;">Category</th>
                <th style="padding:12px;text-align:left;">Current Stock</th>
                <th style="padding:12px;text-align:left;">Threshold</th>
              </tr>
            </thead>

            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <p style="
            margin-top:25px;
            color:#777;
            font-size:13px;
          ">
            This is an automated PizzaHub inventory notification.
          </p>

        </div>
      `,
    });

    console.log(
      `Low-stock alert email sent for ${lowStockItems.length} item(s).`
    );
  } catch (error) {
    console.error(
      "Low-stock email error:",
      error.message
    );
  }
};

// Run the inventory check every hour.
cron.schedule("0 * * * *", () => {
  console.log("Running scheduled low-stock inventory check...");
  checkLowStockAndSendEmail();
});

// =========================================================
// ADMIN AUTHENTICATION MIDDLEWARE
// =========================================================

const requireAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    console.error(
      "Admin authentication error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
};

const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// RAZORPAY CONFIGURATION
// ==========================================

const razorpayKeyId =
  process.env.RAZORPAY_KEY_ID?.trim();

const razorpayKeySecret =
  process.env.RAZORPAY_KEY_SECRET?.trim();

let razorpay = null;

if (razorpayKeyId && razorpayKeySecret) {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });

  console.log("=================================");
  console.log("RAZORPAY CONFIGURATION");
  console.log("=================================");
  console.log("Razorpay credentials loaded: YES");
  console.log("Razorpay Key ID loaded: YES");
} else {
  console.error("=================================");
  console.error("RAZORPAY CONFIGURATION ERROR");
  console.error("=================================");
  console.error(
    "Razorpay credentials are missing."
  );
}

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5175",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ==================== INVENTORY SETUP ====================

const defaultInventory = [
  // Pizza Bases
  {
    name: "Classic Hand Tossed",
    category: "Pizza Base",
    stock: 100,
    threshold: 20,
    unit: "bases",
  },
  {
    name: "Thin Crust",
    category: "Pizza Base",
    stock: 100,
    threshold: 20,
    unit: "bases",
  },
  {
    name: "Cheese Burst",
    category: "Pizza Base",
    stock: 100,
    threshold: 20,
    unit: "bases",
  },
  {
    name: "Whole Wheat",
    category: "Pizza Base",
    stock: 100,
    threshold: 20,
    unit: "bases",
  },
  {
    name: "Pan Crust",
    category: "Pizza Base",
    stock: 100,
    threshold: 20,
    unit: "bases",
  },

  // Sauces
  {
    name: "Tomato",
    category: "Sauce",
    stock: 100,
    threshold: 20,
    unit: "servings",
  },
  {
    name: "Peri Peri",
    category: "Sauce",
    stock: 100,
    threshold: 20,
    unit: "servings",
  },
  {
    name: "Garlic",
    category: "Sauce",
    stock: 100,
    threshold: 20,
    unit: "servings",
  },
  {
    name: "BBQ",
    category: "Sauce",
    stock: 100,
    threshold: 20,
    unit: "servings",
  },
  {
    name: "Pesto",
    category: "Sauce",
    stock: 100,
    threshold: 20,
    unit: "servings",
  },

  // Cheeses
  {
    name: "Mozzarella",
    category: "Cheese",
    stock: 100,
    threshold: 20,
    unit: "servings",
  },
  {
    name: "Cheddar",
    category: "Cheese",
    stock: 100,
    threshold: 20,
    unit: "servings",
  },
  {
    name: "Parmesan",
    category: "Cheese",
    stock: 100,
    threshold: 20,
    unit: "servings",
  },

  // Vegetables
  {
    name: "Onion",
    category: "Vegetable",
    stock: 100,
    threshold: 20,
    unit: "servings",
  },
  {
    name: "Capsicum",
    category: "Vegetable",
    stock: 100,
    threshold: 20,
    unit: "servings",
  },
  {
    name: "Tomato",
    category: "Vegetable",
    stock: 100,
    threshold: 20,
    unit: "servings",
  },
  {
    name: "Mushroom",
    category: "Vegetable",
    stock: 100,
    threshold: 20,
    unit: "servings",
  },
  {
    name: "Sweet Corn",
    category: "Vegetable",
    stock: 100,
    threshold: 20,
    unit: "servings",
  },
  {
    name: "Jalapeño",
    category: "Vegetable",
    stock: 100,
    threshold: 20,
    unit: "servings",
  },
];

const seedInventory = async () => {
  try {
    for (const item of defaultInventory) {
      const existingItem = await Inventory.findOne({
        name: item.name,
        category: item.category,
      });

      if (!existingItem) {
        await Inventory.create(item);
      }
    }

    console.log("Inventory setup completed.");
  } catch (error) {
    console.error("Inventory setup error:", error.message);
  }
};
// ==========================================
// PIZZA DATA
// ==========================================

const pizzas = [
  {
    id: 1,
    name: "Margherita",
    category: "Classic",
    description:
      "Classic cheese pizza with tomato sauce and fresh basil.",
    price: 249,
  },
  {
    id: 2,
    name: "Farmhouse",
    category: "Veg",
    description:
      "Loaded with onion, capsicum, tomato and delicious cheese.",
    price: 329,
  },
  {
    id: 3,
    name: "Pepperoni",
    category: "Non-Veg",
    description:
      "Loaded with spicy pepperoni and extra cheese.",
    price: 399,
  },
  {
    id: 4,
    name: "Veggie Delight",
    category: "Veg",
    description:
      "Fresh vegetables, mozzarella and delicious herbs.",
    price: 299,
  },
  {
    id: 5,
    name: "Chicken Tikka",
    category: "Non-Veg",
    description:
      "Juicy chicken tikka with onions and mozzarella cheese.",
    price: 429,
  },
  {
    id: 6,
    name: "Cheese Burst",
    category: "Classic",
    description:
      "A delicious pizza packed with extra melted cheese.",
    price: 379,
  },
];

// ==========================================
// USER REGISTRATION
// ==========================================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // Check whether user already exists
    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate secure verification token
    const verificationToken =
      crypto.randomBytes(32).toString("hex");

    // Verification token expires in 24 hours
    const verificationExpires =
      new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,

      isEmailVerified: false,

      emailVerificationToken:
        verificationToken,

      emailVerificationExpires:
        verificationExpires,
    });

    // Create verification link
    const verificationLink =
      `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`;

    // Send verification email
    try {
      await emailTransporter.sendMail({
        from: `"PizzaHub" <${process.env.EMAIL_FROM}>`,
        to: cleanEmail,
        subject: "Verify your PizzaHub account 🍕",

        html: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 40px auto;
            padding: 30px;
            background: #f8fafc;
            border-radius: 16px;
            border: 1px solid #e5e7eb;
          ">

            <h1 style="
              color: #111827;
              margin-bottom: 10px;
            ">
              Welcome to PizzaHub! 🍕
            </h1>

            <p style="
              color: #374151;
              font-size: 16px;
            ">
              Hi ${cleanName},
            </p>

            <p style="
              color: #4b5563;
              font-size: 16px;
              line-height: 1.6;
            ">
              Thanks for creating your PizzaHub account.
              Please verify your email address to activate
              your account.
            </p>

            <div style="
              text-align: center;
              margin: 30px 0;
            ">
              <a
                href="${verificationLink}"
                style="
                  display: inline-block;
                  padding: 14px 28px;
                  background: #ef4444;
                  color: white;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                "
              >
                Verify My Email
              </a>
            </div>

            <p style="
              color: #6b7280;
              font-size: 14px;
            ">
              This verification link will expire in 24 hours.
            </p>

            <p style="
              color: #6b7280;
              font-size: 14px;
            ">
              If you did not create this account, you can
              safely ignore this email.
            </p>

          </div>
        `,
      });

      console.log(
        "Verification email sent to:",
        cleanEmail
      );
    } catch (emailError) {
      console.error(
        "Verification email error:",
        emailError.message
      );

      // Remove user if email could not be sent
      await User.findByIdAndDelete(user._id);

      return res.status(500).json({
        success: false,
        message:
          "Registration failed because the verification email could not be sent.",
      });
    }

    console.log(
      "New user registered:",
      user.email
    );

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified:
          user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to register user.",
    });
  }
});

// ==========================================
// VERIFY EMAIL
// ==========================================

app.get("/api/auth/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(`
        <h2>Email verification failed</h2>
        <p>Verification token is missing.</p>
      `);
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).send(`
        <div style="
          font-family: Arial, sans-serif;
          text-align: center;
          margin-top: 80px;
        ">
          <h1>❌ Verification Failed</h1>
          <p>This verification link is invalid or has expired.</p>
        </div>
      `);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();

    console.log(
      "Email verified successfully:",
      user.email
    );

    return res.send(`
      <div style="
        font-family: Arial, sans-serif;
        text-align: center;
        margin-top: 80px;
      ">
        <h1 style="color: #16a34a;">
          ✅ Email Verified Successfully!
        </h1>

        <p style="
          font-size: 18px;
          color: #374151;
        ">
          Your PizzaHub account is now activated.
        </p>

        <p style="color: #6b7280;">
          You can now return to PizzaHub and log in.
        </p>
      </div>
    `);
  } catch (error) {
    console.error(
      "Email verification error:",
      error
    );

    return res.status(500).send(`
      <h2>Email verification failed</h2>
      <p>Something went wrong while verifying your email.</p>
    `);
  }
});

// ==========================================
// FORGOT PASSWORD
// ==========================================

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: cleanEmail,
    });

    // Don't reveal whether an email exists
    if (!user) {
      return res.json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken =
      crypto.randomBytes(32).toString("hex");

    // Token expires in 1 hour
    const resetExpires =
      new Date(Date.now() + 60 * 60 * 1000);

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;

    await user.save();

   const frontendUrl = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
).replace(/\/$/, "");

const resetLink =
  `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await emailTransporter.sendMail({
        from: `"PizzaHub" <${process.env.EMAIL_FROM}>`,
        to: cleanEmail,
        subject: "Reset your PizzaHub password 🔐",

        html: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 40px auto;
            padding: 30px;
            background: #f8fafc;
            border-radius: 16px;
            border: 1px solid #e5e7eb;
          ">

            <h1 style="color: #111827;">
              Password Reset 🔐
            </h1>

            <p style="
              color: #374151;
              font-size: 16px;
            ">
              Hi ${user.name},
            </p>

            <p style="
              color: #4b5563;
              font-size: 16px;
              line-height: 1.6;
            ">
              We received a request to reset your PizzaHub
              password.
            </p>

            <div style="
              text-align: center;
              margin: 30px 0;
            ">
              <a
                href="${resetLink}"
                style="
                  display: inline-block;
                  padding: 14px 28px;
                  background: #ef4444;
                  color: white;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                "
              >
                Reset Password
              </a>
            </div>

            <p style="
              color: #6b7280;
              font-size: 14px;
            ">
              This link will expire in 1 hour.
            </p>

            <p style="
              color: #6b7280;
              font-size: 14px;
            ">
              If you did not request a password reset,
              you can safely ignore this email.
            </p>

          </div>
        `,
      });

      console.log(
        "Password reset email sent to:",
        cleanEmail
      );
    } catch (emailError) {
      console.error(
        "Password reset email error:",
        emailError.message
      );

      user.passwordResetToken = null;
      user.passwordResetExpires = null;

      await user.save();

      return res.status(500).json({
        success: false,
        message:
          "Could not send password reset email.",
      });
    }

    return res.json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to process password reset request.",
    });
  }
});

// ==========================================
// RESET PASSWORD
// ==========================================

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    // Validate input
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required.",
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: {
        $gt: new Date(),
      },
    });

    // Invalid or expired token
    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "This password reset link is invalid or has expired.",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Update password
    user.password = hashedPassword;

    // Remove reset token
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    console.log(
      "Password reset successfully:",
      user.email
    );

    return res.json({
      success: true,
      message:
        "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to reset password.",
    });
  }
});

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PizzaHub Backend API is running!",
  });
});

// ==========================================
// USER LOGIN
// ==========================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Email verification check
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email before logging in.",
      });
    }

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing.");

      return res.status(500).json({
        success: false,
        message: "Authentication is not configured.",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    console.log(
      "User logged in:",
      user.email
    );

    return res.json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to login.",
    });
  }
});

// ==========================================
// GET PIZZAS
// ==========================================

app.get("/api/pizzas", (req, res) => {
  res.json({
    success: true,
    count: pizzas.length,
    pizzas,
  });
});

// ==========================================
// GET SINGLE PIZZA
// ==========================================

app.get("/api/pizzas/:id", (req, res) => {
  const id = Number(req.params.id);

  const pizza = pizzas.find(
    (item) => item.id === id
  );

  if (!pizza) {
    return res.status(404).json({
      success: false,
      message: "Pizza not found.",
    });
  }

  res.json({
    success: true,
    pizza,
  });
});

// ==================== INVENTORY API ====================

// Get all inventory items
app.get(
  "/api/inventory",
  requireAdmin,
  async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({
      category: 1,
      name: 1,
    });

    res.json({
      success: true,
      count: inventory.length,
      inventory,
    });
  } catch (error) {
    console.error("Get inventory error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
    });
  }
});

// Update inventory stock and threshold
  app.put(
  "/api/inventory/:id",
  requireAdmin,
  async (req, res) => {
  try {
    const { stock, threshold } = req.body;

    const parsedStock = Number(stock);
    const parsedThreshold = Number(threshold);

    if (
      !Number.isFinite(parsedStock) ||
      parsedStock < 0 ||
      !Number.isFinite(parsedThreshold) ||
      parsedThreshold < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock and threshold must be valid non-negative numbers.",
      });
    }

    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        stock: parsedStock,
        threshold: parsedThreshold,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    res.json({
      success: true,
      message: "Inventory updated successfully.",
      item,
    });
  } catch (error) {
    console.error("Update inventory error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update inventory",
    });
  }
});

// ==========================================
// CREATE RAZORPAY PAYMENT ORDER
// ==========================================

app.post(
  "/api/payment/create-order",
  async (req, res) => {
    try {
      const { amount } = req.body;

      console.log(
        "================================="
      );
      console.log(
        "CREATING RAZORPAY PAYMENT ORDER"
      );
      console.log(
        "================================="
      );

      console.log("Amount received:", amount);

      // --------------------------------------
      // CHECK RAZORPAY CONFIGURATION
      // --------------------------------------

      if (!razorpayKeyId) {
        console.error(
          "RAZORPAY_KEY_ID is missing."
        );

        return res.status(500).json({
          success: false,
          message:
            "Razorpay Key ID is missing on the server.",
        });
      }

      if (!razorpayKeySecret) {
        console.error(
          "RAZORPAY_KEY_SECRET is missing."
        );

        return res.status(500).json({
          success: false,
          message:
            "Razorpay Key Secret is missing on the server.",
        });
      }

      if (!razorpay) {
        console.error(
          "Razorpay instance is not available."
        );

        return res.status(500).json({
          success: false,
          message:
            "Razorpay is not configured correctly.",
        });
      }

      // --------------------------------------
      // VALIDATE AMOUNT
      // --------------------------------------

      const validAmount = Number(amount);

      if (
        !Number.isFinite(validAmount) ||
        validAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid payment amount is required.",
        });
      }

      // --------------------------------------
      // CONVERT RUPEES TO PAISE
      // --------------------------------------

      const amountInPaise =
        Math.round(validAmount * 100);

      // --------------------------------------
      // CREATE RAZORPAY ORDER
      // --------------------------------------

      const paymentOrder =
        await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: `PH_${Date.now()}`,
        });

      if (
        !paymentOrder ||
        !paymentOrder.id
      ) {
        console.error(
          "Invalid Razorpay response:",
          paymentOrder
        );

        return res.status(500).json({
          success: false,
          message:
            "Razorpay did not return a valid order.",
        });
      }

      console.log(
        "Razorpay order created:",
        paymentOrder.id
      );

      // --------------------------------------
      // FINAL RESPONSE
      // --------------------------------------

      const publicKey =
        process.env.RAZORPAY_KEY_ID?.trim();

      console.log(
        "Public Razorpay Key available:",
        publicKey ? "YES" : "NO"
      );

      // IMPORTANT:
      // Only the PUBLIC KEY ID is sent.
      // NEVER send RAZORPAY_KEY_SECRET.

      return res.status(201).json({
        success: true,

        keyId: publicKey,

        key_id: publicKey,

        razorpayKeyId: publicKey,

        order: {
          id: paymentOrder.id,
          amount: paymentOrder.amount,
          currency:
            paymentOrder.currency,
          receipt:
            paymentOrder.receipt,
          status:
            paymentOrder.status,
        },
      });
    } catch (error) {
      console.error(
        "Create Razorpay order error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error?.error?.description ||
          error?.description ||
          error?.message ||
          "Failed to create Razorpay payment order.",
      });
    }
  }
);

// ==========================================
// VERIFY RAZORPAY PAYMENT
// ==========================================

app.post(
  "/api/payment/verify",
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Missing Razorpay payment details.",
        });
      }

      if (!razorpayKeySecret) {
        return res.status(500).json({
          success: false,
          message:
            "Razorpay verification is not configured.",
        });
      }

      const generatedSignature =
        crypto
          .createHmac(
            "sha256",
            razorpayKeySecret
          )
          .update(
            `${razorpay_order_id}|${razorpay_payment_id}`
          )
          .digest("hex");

      if (
        generatedSignature !==
        razorpay_signature
      ) {
        console.error(
          "Razorpay payment signature mismatch."
        );

        return res.status(400).json({
          success: false,
          message:
            "Payment verification failed.",
        });
      }

      console.log(
        "Razorpay payment verified:",
        razorpay_payment_id
      );

      return res.json({
        success: true,
        message:
          "Payment verified successfully!",
        paymentId:
          razorpay_payment_id,
        orderId:
          razorpay_order_id,
      });
    } catch (error) {
      console.error(
        "Payment verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Payment verification failed.",
      });
    }
  }
);

// ==========================================
// CREATE ORDER
// ==========================================

app.post(
  "/api/orders",
  async (req, res) => {
    try {
      const {
        name,
        phone,
        address,
        city,
        pincode,
        total,
        items,
        razorpayOrderId,
        razorpayPaymentId,
        paymentStatus,
      } = req.body;

      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Customer name is required.",
        });
      }

      if (
        typeof phone !== "string" ||
        !phone.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Customer phone number is required.",
        });
      }

      if (
        typeof address !== "string" ||
        !address.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery address is required.",
        });
      }

      if (
        typeof city !== "string" ||
        !city.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "City is required.",
        });
      }

      if (
        typeof pincode !== "string" ||
        !pincode.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Pincode is required.",
        });
      }

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Order must contain at least one item.",
        });
      }

      if (
        typeof total !== "number" ||
        !Number.isFinite(total) ||
        total <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid order total is required.",
        });
      }

      const orderId = `PH${Date.now()
        .toString()
        .slice(-6)}`;

      const order =
        await Order.create({
          orderId,

          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          pincode: pincode.trim(),

          total,
          items,

          status: "Pending",

          paymentStatus:
            paymentStatus || "Pending",

          razorpayOrderId:
            razorpayOrderId || "",

          razorpayPaymentId:
            razorpayPaymentId || "",
        });

      console.log(
        "Order saved to MongoDB:",
        order.orderId
      );

      // Deduct inventory after the order is successfully saved
try {
  await deductInventoryForOrder(order.items);

  console.log(
    `Inventory deducted for order: ${order.orderId}`
  );
} catch (inventoryError) {
  console.error(
    "Inventory deduction error:",
    inventoryError.message
  );
}

return res.status(201).json({
  success: true,
  message: "Order placed successfully!",
  order,
});

      return res.status(201).json({
        success: true,
        message:
          "Order placed successfully!",
        order,
      });
    } catch (error) {
      console.error(
        "Create order error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create order.",
      });
    }
  }
);

// ==========================================
// GET ALL ORDERS
// ==========================================

app.get(
  "/api/orders",
    requireAdmin,
   async (req, res) => {
    try {
      const orders =
        await Order.find().sort({
          createdAt: -1,
        });

      return res.json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (error) {
      console.error(
        "Get orders error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch orders.",
      });
    }
  }
);

// ==========================================
// GET SINGLE ORDER
// ==========================================

app.get(
  "/api/orders/:id",
  async (req, res) => {
    try {
      const order =
        await Order.findOne({
          orderId: req.params.id.trim(),
        });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      return res.json({
        success: true,
        order,
      });
    } catch (error) {
      console.error(
        "Get order error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch order.",
      });
    }
  }
);

// ==========================================
// UPDATE ORDER STATUS
// ==========================================

   app.put(
   "/api/orders/:id",
   requireAdmin,
   async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Preparing",
        "Out for Delivery",
        "Delivered",
      ];

      if (
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order status.",
        });
      }

      const order =
        await Order.findOneAndUpdate(
          {
            orderId:
              req.params.id.trim(),
          },
          {
            status,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "Order status updated successfully.",
        order,
      });
    } catch (error) {
      console.error(
        "Update order error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update order.",
      });
    }
  }
);

// ==========================================
// 404
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

// ==========================================
// START SERVER
// ==========================================

const startServer = async () => {
  try {
    await connectDB();

    // =========================================================
// ADMIN ACCOUNT SETUP
// =========================================================

if (process.env.ADMIN_EMAIL) {
  const adminEmail = process.env.ADMIN_EMAIL
    .trim()
    .toLowerCase();

  const adminUser = await User.findOneAndUpdate(
    { email: adminEmail },
    { role: "admin" },
    { new: true }
  );

  if (adminUser) {
    console.log(
      `Admin account configured: ${adminUser.email}`
    );
  } else {
    console.log(
      `Admin account not found for: ${adminEmail}`
    );
  }
}

    // Remove old unique index on inventory name.
    // This is required because "Tomato" exists as
    // both a Sauce and a Vegetable.
    try {
      await Inventory.collection.dropIndex("name_1");
      console.log("Old inventory index removed.");
    } catch (error) {
      if (error.codeName === "IndexNotFound") {
        console.log("Old inventory index already removed.");
      } else {
        console.error(
          "Inventory index cleanup error:",
          error.message
        );
      }
    }

    await seedInventory();

    app.listen(PORT, () => {
      console.log(
        "================================="
      );

      console.log(
        `PizzaHub server running on http://localhost:${PORT}`
      );

      console.log(
        "Razorpay Key ID loaded:",
        razorpayKeyId
          ? "YES"
          : "NO"
      );

      console.log(
        "================================="
      );
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();