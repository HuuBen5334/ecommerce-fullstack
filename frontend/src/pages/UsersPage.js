import { useState, memo } from "react";
import { useFetch } from "../useFetch";

const UserRow = memo(function UserRow({ user }) {
  return (
    <tr>
      <td>{user.id}</td>
      <td>{user.name}</td>
      <td>{user.email}</td>
    </tr>
  );
});

export default function UsersPage() {
  const { data: users, error, refetch } = useFetch("/users");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    try {
      const res = await fetch("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setName("");
      setEmail("");
      refetch();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  }

  if (error) return <p>Error: {error}</p>;

  return (
    <div className="page">
      <h1>Users</h1>

      <form onSubmit={handleCreate} style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem" }}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create User"}
        </button>
        {formError && <span style={{ color: "red" }}>{formError}</span>}
      </form>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
