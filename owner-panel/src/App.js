import React, { useState, useEffect } from 'react';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        onLogin(data.token);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Network error');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8, background: '#fff' }}>
      <h2>Ground Owner Login</h2>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required style={{ width: '100%', marginBottom: 12, padding: 8 }} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required style={{ width: '100%', marginBottom: 12, padding: 8 }} />
      <button type="submit" style={{ width: '100%', padding: 8 }}>Login</button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </form>
  );
}

function Dashboard({ token, onLogout }) {
  const [owner, setOwner] = useState(null);
  const [grounds, setGrounds] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const meRes = await fetch('http://localhost:3001/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        const me = await meRes.json();
        if (!me.success || me.user.role !== 'ground_owner') throw new Error('Not a ground owner');
        setOwner(me.user);
        const groundsRes = await fetch('http://localhost:3001/api/grounds/owner', { headers: { Authorization: `Bearer ${token}` } });
        const groundsData = await groundsRes.json();
        setGrounds(groundsData.grounds || []);
        const bookingsRes = await fetch('http://localhost:3001/api/bookings/owner', { headers: { Authorization: `Bearer ${token}` } });
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData.bookings || []);
      } catch (err) {
        setError('Failed to load dashboard: ' + err.message);
      }
    }
    fetchData();
  }, [token]);

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/bookings/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBookings(bookings => bookings.map(b => b._id === id ? { ...b, status: 'confirmed' } : b));
      } else {
        alert(data.message || 'Failed to approve');
      }
    } catch {
      alert('Failed to approve');
    }
  };

  if (error) return <div style={{ color: 'red', padding: 32 }}>{error}</div>;
  if (!owner) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8 }}>
      <h2>Welcome, {owner.name} (Ground Owner)</h2>
      <button onClick={onLogout} style={{ float: 'right', marginTop: -40 }}>Logout</button>
      <h3>Your Grounds</h3>
      {grounds.length === 0 ? <div>No grounds found.</div> : (
        <ul>
          {grounds.map(g => (
            <li key={g._id} style={{ marginBottom: 12, padding: 12, border: '1px solid #eee', borderRadius: 6 }}>
              <b>{g.name}</b> ({g.status})<br />
              {g.description}<br />
              {g.location.address}, {g.location.cityName}
            </li>
          ))}
        </ul>
      )}
      <h3>Bookings</h3>
      {bookings.length === 0 ? <div>No bookings found.</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>User</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b._id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{b.bookingId}</td>
                <td>{b.userId?.name} <br /> {b.userId?.email}</td>
                <td>{new Date(b.bookingDate).toLocaleDateString()}</td>
                <td>{b.timeSlot.startTime} - {b.timeSlot.endTime}</td>
                <td>{b.status}</td>
                <td>
                  {b.status === 'pending' ? (
                    <button onClick={() => handleApprove(b._id)} style={{ padding: 6 }}>Approve</button>
                  ) : (
                    <span>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('ownerToken') || '');

  const handleLogin = (token) => {
    setToken(token);
    localStorage.setItem('ownerToken', token);
  };
  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('ownerToken');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {!token ? <Login onLogin={handleLogin} /> : <Dashboard token={token} onLogout={handleLogout} />}
    </div>
  );
}

export default App;
