// ProductsPage.js
import { useFetch } from "../useFetch";
import { memo } from "react";

const ProductRow = memo(function ProductRow({ product }) {
  return (
    <tr>
      <td>{product.id}</td>
      <td>{product.name}</td>
      <td>${product.price}</td>
      <td>{product.stockQuantity}</td>
    </tr>
  );
});

export default function ProductsPage() {
  const { data: products, error } = useFetch("/products");
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
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </tbody>
      </table>
    </div>
  );

}