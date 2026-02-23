import React, { useState, useEffect } from 'react';
import { users as usersApi } from '../api';

function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await usersApi.list();
        if (response.success && response.data) {
          setUsers(response.data);
        } else {
          setError(response.message || 'Failed to fetch users');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) {
    return <div className="loading-screen">Loading users...</div>;
  }

  if (error) {
    return <div className="alert alert-error">Error: {error}</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>User Management</h1>
      </div>
      <div className="card">
        <h2>Users List</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Full Name</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.nom_complet || '-'}</td>
                  <td>{user.is_active ? 'Yes' : 'No'}</td>
                  <td>
                    {/* Add edit/delete buttons here later */}
                    <button className="btn-action btn-edit">Edit</button>
                    <button className="btn-action btn-delete">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserListPage;
