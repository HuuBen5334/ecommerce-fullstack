import { useState, memo } from "react";
import { useFetch } from "../useFetch";

async function replenish(product) {
  const res = await fetch(`/products/${product.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: product.name,
      price: product.price,
      stockQuantity: 100,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

const ProductRow = memo(function ProductRow({ product, onReplenish, replenishing }) {
  return (
    <tr>
      <td>{product.id}</td>
      <td>{product.name}</td>
      <td>${product.price}</td>
      <td>{product.stockQuantity}</td>
      <td>
        {product.stockQuantity === 0 && (
          <button
            className="btn-replenish"
            onClick={() => onReplenish(product)}
            disabled={replenishing === product.id}
          >
            {replenishing === product.id ? "Replenishing..." : "⟳ Replenish"}
          </button>
        )}
      </td>
    </tr>
  );
});

export default function ProductsPage() {
  const { data: products, error, refetch } = useFetch("/products");
  const [replenishing, setReplenishing] = useState(null);

  async function handleReplenish(product) {
    setReplenishing(product.id);
    try {
      await replenish(product);
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setReplenishing(null);
    }
  }

  if (error) return <p>Error: {error}</p>;

  return (
    <div className="page">
      <h1>Products</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onReplenish={handleReplenish}
              replenishing={replenishing}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
