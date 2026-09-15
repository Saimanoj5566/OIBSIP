function PizzaCard({ pizza, onAddToCart }) {
  return (
    <div className="pizza-card">

      <div className="pizza-image">
        {pizza.image ? (
          <img
            src={pizza.image}
            alt={pizza.name}
          />
        ) : (
          <div className="no-image">
            🍕
          </div>
        )}
      </div>

      <div className="pizza-info">

        <span className="pizza-category">
          {pizza.category}
        </span>

        <h3>{pizza.name}</h3>

        <p>{pizza.description}</p>

        <div className="pizza-bottom">
          <strong>₹{pizza.price}</strong>

          <button onClick={() => onAddToCart(pizza)}>
            Add to Cart
          </button>
        </div>

      </div>

    </div>
  );
}

export default PizzaCard;