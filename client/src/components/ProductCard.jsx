// src/components/ProductCard.jsx
export default function ProductCard({ product }) {
  return (
    <div style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p>Цена: {product.price}₽</p>
      <button onClick={() => addToCart(product)}>
      В корзину
      </button>

    </div>
  );
}
const addToCart = (product) => {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Добавлено в корзину");
};

