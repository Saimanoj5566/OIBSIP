import margherita from "../assets/pizzas/margherita.jpg";
import farmhouse from "../assets/pizzas/farmhouse.jpg";
import pepperoni from "../assets/pizzas/pepperoni-pizza.png";
import veggie from "../assets/pizzas/veggie.jpg";
import chickenTikka from "../assets/pizzas/chicken-tikka.jpg";
import cheese from "../assets/pizzas/cheese.jpg";

const pizzaData = [
  {
    id: 1,
    name: "Margherita",
    image: margherita,
    description: "Classic cheese pizza with tomato sauce and fresh basil.",
    price: 249,
    category: "Classic",
  },

  {
    id: 2,
    name: "Farmhouse",
    image: farmhouse,
    description: "Loaded with onion, capsicum, tomato and delicious cheese.",
    price: 329,
    category: "Veg",
  },

  {
    id: 3,
    name: "Pepperoni",
    image: pepperoni,
    description: "Classic pepperoni pizza with rich tomato sauce and cheese.",
    price: 449,
    category: "Non-Veg",
  },

  {
    id: 4,
    name: "Veggie Delight",
    image: veggie,
    description: "A delicious combination of fresh vegetables and cheese.",
    price: 379,
    category: "Veg",
  },

  {
    id: 5,
    name: "Chicken Tikka",
    image: chickenTikka,
    description: "Spicy chicken tikka with onions, capsicum and mozzarella.",
    price: 399,
    category: "Non-Veg",
  },

  {
    id: 6,
    name: "Cheese Burst",
    image: cheese,
    description: "Rich and creamy cheese-filled pizza with extra mozzarella.",
    price: 429,
    category: "Premium",
  },
];

export default pizzaData;