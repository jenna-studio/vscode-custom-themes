import React, { useState, useEffect, useCallback } from "react";

// Types and interfaces
interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  avatar?: string;
}

type SortDirection = "asc" | "desc";
type FilterFn = (user: User) => boolean;

const ROLES = ["admin", "editor", "viewer"] as const;

// A custom hook
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// Props with generics
interface TableProps<T> {
  data: T[];
  columns: Array<keyof T>;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  emptyMessage = "No data available",
}: TableProps<T>) {
  if (data.length === 0) {
    return <p className="text-gray-500 italic">{emptyMessage}</p>;
  }

  return (
    <table className="min-w-full border-collapse">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col)} className="px-4 py-2 text-left font-bold">
              {String(col)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr
            key={index}
            onClick={() => onRowClick?.(item)}
            className="hover:bg-sky-50 cursor-pointer"
          >
            {columns.map((col) => (
              <td key={String(col)} className="px-4 py-2">
                {String(item[col] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Main component
const UserDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data: User[] = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filterUsers: FilterFn = useCallback(
    (user) => user.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
    [debouncedSearch]
  );

  const sortedUsers = [...users]
    .filter(filterUsers)
    .sort((a, b) =>
      sortDir === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

  const toggleSort = () =>
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));

  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          onClick={toggleSort}
          className="px-4 py-2 bg-sky-500 text-white rounded"
        >
          Sort {sortDir === "asc" ? "\u2191" : "\u2193"}
        </button>
      </div>

      <p className="mb-2 text-sm">
        Showing {sortedUsers.length} of {users.length} users
      </p>

      <DataTable<User>
        data={sortedUsers}
        columns={["name", "email", "role"]}
        onRowClick={(user) => console.log("Selected:", user.id)}
      />
    </div>
  );
};

export default UserDashboard;
