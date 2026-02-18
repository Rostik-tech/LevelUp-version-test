// src/components/ProductCard.jsx
export default function ProductCard({ product }) {
  return (
    <div style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p>Цена: {product.price}₽</p>
    </div>
  );
}
