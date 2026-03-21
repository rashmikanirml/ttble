import type { User } from "../types/models";

type UserTableProps = {
  users: User[];
  onDeactivate: (userId: string) => Promise<void>;
};

export function UserTable({ users, onDeactivate }: UserTableProps) {
  if (!users.length) {
    return <p>No users yet.</p>;
  }

  return (
    <table cellPadding={8} style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th align="left">Name</th>
          <th align="left">Email</th>
          <th align="left">Role</th>
          <th align="left">Status</th>
          <th align="left">Action</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.fullName}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>{user.status}</td>
            <td>
              <button
                onClick={() => onDeactivate(user.id)}
                disabled={user.status === "inactive"}
                type="button"
              >
                Deactivate
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
