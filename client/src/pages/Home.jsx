import { useEffect, useState } from "react";
import { getProducts } from "../api/api.js";
import ProductCard from "../components/ProductCard.jsx";

function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
  }, []);

  return (
    <div>
      <h1>Товары</h1>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

export default Home;
