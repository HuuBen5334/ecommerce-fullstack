// UsersPage.js
import { useFetch } from "../useFetch";
import { memo } from "react";

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
    const { data: users, error } = useFetch("/users");
    if (error) return <p>Error: {error}</p>;
  return (
    <div className="page">
      <h1>Users</h1>
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
