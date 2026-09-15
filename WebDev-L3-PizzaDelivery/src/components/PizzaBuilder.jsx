import { useState } from "react";

function PizzaBuilder({ onAddCustomPizza }) {
  const [base, setBase] = useState("");
  const [sauce, setSauce] = useState("");
  const [cheese, setCheese] = useState("");
  const [vegetables, setVegetables] = useState([]);

  const bases = [
    { name: "Classic Hand Tossed", price: 399 },
    { name: "Thin Crust", price: 419 },
    { name: "Cheese Burst", price: 449 },
    { name: "Whole Wheat", price: 429 },
    { name: "Pan Crust", price: 439 },
  ];

  const sauces = [
    { name: "Classic Tomato", price: 0 },
    { name: "Spicy Peri Peri", price: 20 },
    { name: "Creamy Garlic", price: 25 },
    { name: "BBQ Sauce", price: 25 },
    { name: "Pesto Sauce", price: 35 },
  ];

  const cheeses = [
    { name: "Mozzarella", price: 0 },
    { name: "Cheddar", price: 30 },
    { name: "Parmesan", price: 40 },
  ];

  const vegetableOptions = [
    { name: "Onion", price: 20 },
    { name: "Capsicum", price: 20 },
    { name: "Tomato", price: 20 },
    { name: "Mushroom", price: 30 },
    { name: "Sweet Corn", price: 25 },
    { name: "Jalapeño", price: 25 },
  ];

  const toggleVegetable = (vegetable) => {
    setVegetables((current) =>
      current.includes(vegetable)
        ? current.filter((item) => item !== vegetable)
        : [...current, vegetable]
    );
  };

  const selectedBase = bases.find(
    (item) => item.name === base
  );

  const selectedSauce = sauces.find(
    (item) => item.name === sauce
  );

  const selectedCheese = cheeses.find(
    (item) => item.name === cheese
  );

  const vegetableTotal = vegetables.reduce(
    (sum, vegetable) => {
      const item = vegetableOptions.find(
        (option) => option.name === vegetable
      );

      return sum + (item?.price || 0);
    },
    0
  );

  const customPizzaPrice =
    (selectedBase?.price || 0) +
    (selectedSauce?.price || 0) +
    (selectedCheese?.price || 0) +
    vegetableTotal;

  const handleAddPizza = () => {
    if (!base || !sauce || !cheese) {
      alert(
        "Please select a base, sauce and cheese."
      );
      return;
    }

    const customPizza = {
      id: `custom-${Date.now()}`,
      name: "Custom Pizza",
      category: "CUSTOM PIZZA",
      base,
      sauce,
      cheese,
      vegetables,
      price: customPizzaPrice,
      quantity: 1,
    };

    onAddCustomPizza(customPizza);

    alert("Custom pizza added to cart! 🍕");

    setBase("");
    setSauce("");
    setCheese("");
    setVegetables([]);
  };

  return (
    <section
      className="builder-section"
      id="builder"
    >
      <div className="section-heading">
        <p>CREATE YOUR OWN</p>

        <h2>Build Your Custom Pizza</h2>

        <span>
          Choose your favourite ingredients and
          create a pizza made just for you.
        </span>
      </div>

      {/* BASE */}

      <div className="builder-step">
        <h3>
          Step 1 — Choose Your Base
        </h3>

        <div className="builder-options">
          {bases.map((item) => (
            <button
              type="button"
              key={item.name}
              className={
                base === item.name
                  ? "selected"
                  : ""
              }
              onClick={() =>
                setBase(item.name)
              }
            >
              <span>{item.name}</span>

              <small>
                ₹{item.price}
              </small>
            </button>
          ))}
        </div>
      </div>

      {/* SAUCE */}

      <div className="builder-step">
        <h3>
          Step 2 — Choose Your Sauce
        </h3>

        <div className="builder-options">
          {sauces.map((item) => (
            <button
              type="button"
              key={item.name}
              className={
                sauce === item.name
                  ? "selected"
                  : ""
              }
              onClick={() =>
                setSauce(item.name)
              }
            >
              <span>{item.name}</span>

              <small>
                {item.price === 0
                  ? "FREE"
                  : `+₹${item.price}`}
              </small>
            </button>
          ))}
        </div>
      </div>

      {/* CHEESE */}

      <div className="builder-step">
        <h3>
          Step 3 — Choose Your Cheese
        </h3>

        <div className="builder-options">
          {cheeses.map((item) => (
            <button
              type="button"
              key={item.name}
              className={
                cheese === item.name
                  ? "selected"
                  : ""
              }
              onClick={() =>
                setCheese(item.name)
              }
            >
              <span>{item.name}</span>

              <small>
                {item.price === 0
                  ? "FREE"
                  : `+₹${item.price}`}
              </small>
            </button>
          ))}
        </div>
      </div>

      {/* VEGETABLES */}

      <div className="builder-step">
        <h3>
          Step 4 — Choose Your Vegetables
        </h3>

        <div className="builder-options">
          {vegetableOptions.map(
            (item) => (
              <button
                type="button"
                key={item.name}
                className={
                  vegetables.includes(
                    item.name
                  )
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  toggleVegetable(
                    item.name
                  )
                }
              >
                <span>
                  {item.name}
                </span>

                <small>
                  +₹{item.price}
                </small>
              </button>
            )
          )}
        </div>
      </div>

      {/* SUMMARY */}

      <div className="builder-summary">
        <div>
          <span>
            YOUR CUSTOM PIZZA
          </span>

          <h3>
            {base || "Choose your pizza"}
          </h3>
        </div>

        <div className="builder-summary-details">
          <p>
            <strong>Base:</strong>{" "}
            {base || "Not selected"}
          </p>

          <p>
            <strong>Sauce:</strong>{" "}
            {sauce || "Not selected"}
          </p>

          <p>
            <strong>Cheese:</strong>{" "}
            {cheese || "Not selected"}
          </p>

          <p>
            <strong>Vegetables:</strong>{" "}
            {vegetables.length > 0
              ? vegetables.join(", ")
              : "None selected"}
          </p>
        </div>

        <div className="builder-price">
          <span>YOUR PRICE</span>

          <strong>
            ₹{customPizzaPrice}
          </strong>
        </div>

        <button
          type="button"
          onClick={handleAddPizza}
          className="builder-add-button"
          disabled={
            !base || !sauce || !cheese
          }
        >
          Add Custom Pizza
          <span>→</span>
        </button>
      </div>
    </section>
  );
}

export default PizzaBuilder;