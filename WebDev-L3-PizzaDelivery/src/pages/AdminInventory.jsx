import { useEffect, useState } from "react";

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");

  // =========================================================
  // FETCH INVENTORY
  // =========================================================

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("pizzahubToken");

      if (!token) {
        throw new Error(
          "Admin authentication token not found."
        );
      }

      const response = await fetch(
        "http://localhost:5000/api/inventory",
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
          data.message || "Failed to load inventory."
        );
      }

      setInventory(data.inventory || []);
    } catch (error) {
      console.error(
        "Inventory fetch error:",
        error
      );

      setMessage(
        error.message ||
          "Failed to load inventory."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD INVENTORY WHEN PAGE OPENS
  // =========================================================

  useEffect(() => {
    fetchInventory();
  }, []);

  // =========================================================
  // UPDATE INVENTORY ITEM
  // =========================================================

  const updateItem = async (item) => {
    try {
      setUpdatingId(item._id);
      setMessage("");

      const token = localStorage.getItem(
        "pizzahubToken"
      );

      if (!token) {
        throw new Error(
          "Admin authentication token not found."
        );
      }

      const response = await fetch(
        `http://localhost:5000/api/inventory/${item._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            stock: Number(item.stock),
            threshold: Number(item.threshold),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update inventory."
        );
      }

      setInventory((current) =>
        current.map((inventoryItem) =>
          inventoryItem._id === item._id
            ? data.item
            : inventoryItem
        )
      );

      setMessage(
        `${item.name} updated successfully.`
      );
    } catch (error) {
      console.error(
        "Inventory update error:",
        error
      );

      setMessage(
        error.message ||
          "Failed to update inventory."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================================================
  // UPDATE LOCAL INPUT FIELD
  // =========================================================

  const updateField = (id, field, value) => {
    setInventory((current) =>
      current.map((item) =>
        item._id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  // =========================================================
  // STOCK STATUS
  // =========================================================

  const getStockClass = (
    stock,
    threshold
  ) => {
    if (stock <= threshold) {
      return "low";
    }

    if (stock <= threshold * 2) {
      return "medium";
    }

    return "good";
  };

  // =========================================================
  // CATEGORY CSS CLASS
  // =========================================================

  const getCategoryClass = (category) => {
    return category
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <section
      id="admin-inventory"
      className="admin-inventory-section"
    >
      <div className="admin-inventory-container">

        {/* HEADER */}

        <div className="admin-inventory-header">
          <div>
            <span className="admin-inventory-kicker">
              PIZZAHUB ADMIN
            </span>

            <h1>Inventory Management</h1>

            <p>
              Monitor stock levels and update
              inventory whenever supplies change.
            </p>
          </div>

          <button
            className="inventory-refresh-button"
            onClick={fetchInventory}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        {/* MESSAGE */}

        {message && (
          <div className="inventory-message">
            {message}
          </div>
        )}

        {/* STATS */}

        <div className="inventory-stats">

          <div className="inventory-stat-card">
            <span>📦</span>

            <div>
              <strong>
                {inventory.length}
              </strong>

              <small>
                Total Items
              </small>
            </div>
          </div>

          <div className="inventory-stat-card">
            <span>⚠️</span>

            <div>
              <strong>
                {
                  inventory.filter(
                    (item) =>
                      Number(item.stock) <=
                      Number(item.threshold)
                  ).length
                }
              </strong>

              <small>
                Low Stock
              </small>
            </div>
          </div>

          <div className="inventory-stat-card">
            <span>✅</span>

            <div>
              <strong>
                {
                  inventory.filter(
                    (item) =>
                      Number(item.stock) >
                      Number(item.threshold)
                  ).length
                }
              </strong>

              <small>
                Healthy Stock
              </small>
            </div>
          </div>

        </div>

        {/* LOADING */}

        {loading ? (
          <div className="inventory-loading">
            Loading inventory...
          </div>

        ) : inventory.length === 0 ? (

          /* EMPTY */

          <div className="inventory-empty">
            No inventory items found.
          </div>

        ) : (

          /* TABLE */

          <div className="inventory-table-wrapper">

            <table className="inventory-table">

              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {inventory.map((item) => {

                  const stockClass =
                    getStockClass(
                      Number(item.stock),
                      Number(item.threshold)
                    );

                  return (
                    <tr key={item._id}>

                      {/* ITEM */}

                      <td>
                        <div className="inventory-item-name">
                          {item.name}
                        </div>
                      </td>

                      {/* CATEGORY */}

                      <td>
                        <span
                          className={`inventory-category ${getCategoryClass(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                      </td>

                      {/* STOCK */}

                      <td>
                        <div className="inventory-input-group">

                          <input
                            type="number"
                            min="0"
                            value={item.stock}
                            onChange={(e) =>
                              updateField(
                                item._id,
                                "stock",
                                e.target.value
                              )
                            }
                          />

                          <span>
                            {item.unit}
                          </span>

                        </div>
                      </td>

                      {/* THRESHOLD */}

                      <td>
                        <input
                          className="inventory-threshold-input"
                          type="number"
                          min="0"
                          value={item.threshold}
                          onChange={(e) =>
                            updateField(
                              item._id,
                              "threshold",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={`inventory-status ${stockClass}`}
                        >
                          {stockClass === "low"
                            ? "Low Stock"
                            : stockClass === "medium"
                            ? "Moderate"
                            : "In Stock"}
                        </span>
                      </td>

                      {/* SAVE */}

                      <td>
                        <button
                          className="inventory-save-button"
                          onClick={() =>
                            updateItem(item)
                          }
                          disabled={
                            updatingId ===
                            item._id
                          }
                        >
                          {updatingId ===
                          item._id
                            ? "Saving..."
                            : "Save"}
                        </button>
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>
    </section>
  );
};

export default AdminInventory;