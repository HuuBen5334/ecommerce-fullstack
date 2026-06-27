export async function placeOrder(productId, userId, quantity) {
  const res = await fetch(
    `/orders?productId=${productId}&userId=${userId}&quantity=${quantity}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
