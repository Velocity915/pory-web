import { useState, useEffect } from 'react';
import { getAdminStats, getAllUsers, deleteUser } from './api';
import './AdminPanel.css';

function AdminPanel({ onClose }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        getAdminStats(),
        getAllUsers()
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This will also delete their Pokemon collection.`)) {
      return;
    }

    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      // Reload stats after deletion
      const newStats = await getAdminStats();
      setStats(newStats);
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="admin-overlay">
        <div className="admin-panel">
          <div className="admin-loading">Loading admin data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <h2>Admin Panel</h2>
          <button onClick={onClose} className="admin-close">X</button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-stats">
          <h3>Statistics</h3>
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-number">{stats?.total_users || 0}</span>
              <span className="stat-label">Total Users</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{stats?.total_pokemon || 0}</span>
              <span className="stat-label">Total Pokemon</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{stats?.total_shinies || 0}</span>
              <span className="stat-label">Shiny Pokemon</span>
            </div>
          </div>
        </div>

        <div className="admin-users">
          <h3>Users</h3>
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Admin</th>
                <th>Pokemon</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.is_admin ? <span className="admin-badge">Admin</span> : '-'}</td>
                  <td>{user.pokemon_count}</td>
                  <td>
                    {!user.is_admin && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="delete-user-btn"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
