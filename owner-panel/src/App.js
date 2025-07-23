import React, { useState, useEffect } from "react";
import { FiMenu, FiLogOut, FiUser, FiHome, FiClipboard, FiSettings } from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import { FaCheckCircle, FaTimesCircle, FaClock, FaUserCircle } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { BsTelephone } from "react-icons/bs";
import "./index.css";

const SIDEBAR_LINKS = [
  { name: "Dashboard", icon: <FiHome />, key: "dashboard" },
  { name: "Bookings", icon: <FiClipboard />, key: "bookings" },
  { name: "Profile", icon: <FiUser />, key: "profile" },
  { name: "Settings", icon: <FiSettings />, key: "settings" },
];

function Avatar({ name }) {
  if (!name) return <FaUserCircle className="w-8 h-8 text-green-700" />;
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-700 text-white font-bold text-lg">
      {initials}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function BookingDetailsModal({ booking, onClose }) {
  if (!booking) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-2 p-6 relative animate-fade-in">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4 text-green-800">Booking Details</h2>
        <div className="space-y-2">
          <div><b>Booking ID:</b> {booking.bookingId}</div>
          <div><b>Status:</b> <StatusBadge status={booking.status} /></div>
          <div><b>Date:</b> {new Date(booking.bookingDate).toLocaleDateString()}</div>
          <div><b>Time:</b> {booking.timeSlot.startTime} - {booking.timeSlot.endTime}</div>
          <div><b>Ground:</b> {booking.groundId?.name} <span className="text-gray-500 text-xs">{booking.groundId?.location?.address}</span></div>
          <div className="flex items-center gap-2"><b>User:</b> <Avatar name={booking.userId?.name} /> {booking.userId?.name}</div>
          <div className="flex items-center gap-2"><MdOutlineEmail /> {booking.userId?.email}</div>
          <div className="flex items-center gap-2"><BsTelephone /> {booking.playerDetails?.contactPerson?.phone || "-"}</div>
          <div><b>Advance Paid:</b> <span className="text-green-700 font-bold">₹{booking.pricing?.totalAmount || "-"}</span></div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // Simulated state for demonstration
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedNav, setSelectedNav] = useState("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Simulated data
  const owner = { name: "T.K. Gaming", email: "oneloki05@gmail.com" };
  const bookings = [
    {
      _id: "1",
      bookingId: "BCMDE3LO9VQKH5L",
      userId: { name: "T.K. Gaming", email: "oneloki05@gmail.com" },
      playerDetails: { contactPerson: { phone: "9328978130" } },
      groundId: { name: "tafs", location: { address: "Parshv mombasa, Mumbai" } },
      bookingDate: "2025-07-22T14:00:00Z",
      timeSlot: { startTime: "14:00", endTime: "15:00" },
      pricing: { totalAmount: 506 },
      status: "confirmed",
    },
    // ... more bookings
  ];

  // Responsive sidebar
  const sidebarClasses = sidebarOpen
    ? "fixed inset-0 z-40 bg-black/40 flex md:static md:bg-transparent"
    : "hidden md:flex";

  return (
    <div className="owner-panel-root min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarClasses} w-64 flex-shrink-0`}>
        <nav className="bg-white h-full w-64 shadow-lg flex flex-col py-8 px-4">
          <div className="mb-8 flex items-center gap-2">
            <span className="text-2xl font-bold text-green-700">🏏 BoxCric</span>
          </div>
          <ul className="flex-1 space-y-2">
            {SIDEBAR_LINKS.map(link => (
              <li key={link.key}>
                <button
                  className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-lg font-medium transition ${
                    selectedNav === link.key
                      ? "bg-green-100 text-green-800"
                      : "hover:bg-green-50 text-gray-700"
                  }`}
                  onClick={() => {
                    setSelectedNav(link.key);
                    setSidebarOpen(false);
                  }}
                >
                  {link.icon}
                  {link.name}
                </button>
              </li>
            ))}
          </ul>
          <button
            className="mt-8 flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition"
            onClick={() => toast.success("Logged out!")}
          >
            <FiLogOut /> Logout
          </button>
        </nav>
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="flex items-center justify-between bg-white shadow px-6 py-4 sticky top-0 z-20">
          <button
            className="md:hidden text-2xl text-green-700"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <FiMenu />
          </button>
          <h1 className="text-2xl font-bold text-green-800 tracking-wide">Ground Owner Panel</h1>
          <div className="flex items-center gap-3">
            <Avatar name={owner.name} />
            <span className="font-semibold text-gray-700">{owner.name}</span>
          </div>
        </header>

        {/* Analytics Cards */}
        <section className="owner-panel-section grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <span className="text-3xl text-green-700 font-bold">{bookings.length}</span>
            <span className="text-gray-500 mt-2">Total Bookings</span>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <span className="text-3xl text-green-700 font-bold">
              ₹{bookings.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0)}
            </span>
            <span className="text-gray-500 mt-2">Total Revenue</span>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <span className="text-3xl text-yellow-600 font-bold">
              {bookings.filter(b => b.status === "pending").length}
            </span>
            <span className="text-gray-500 mt-2">Pending Bookings</span>
          </div>
        </section>

        {/* Bookings Table */}
        <section className="owner-panel-section mt-8">
          <h2 className="owner-panel-section-title">All Bookings for Your Grounds</h2>
          <div className="overflow-x-auto mt-4 rounded-lg shadow">
            <table className="min-w-full bg-white divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Booking ID</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Ground</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Advance Paid</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr
                    key={b._id}
                    className="hover:bg-green-50 transition cursor-pointer"
                    onClick={() => {
                      setSelectedBooking(b);
                      setShowModal(true);
                    }}
                  >
                    <td className="px-4 py-2">{b.bookingId}</td>
                    <td className="px-4 py-2 flex items-center gap-2">
                      <Avatar name={b.userId?.name} />
                      <span>
                        {b.userId?.name}
                        <div className="text-xs text-gray-500">{b.userId?.email}</div>
                      </span>
                    </td>
                    <td className="px-4 py-2">{b.playerDetails?.contactPerson?.phone || "-"}</td>
                    <td className="px-4 py-2">{b.groundId?.name}<div className="text-xs text-gray-500">{b.groundId?.location?.address}</div></td>
                    <td className="px-4 py-2">{new Date(b.bookingDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{b.timeSlot.startTime} - {b.timeSlot.endTime}</td>
                    <td className="px-4 py-2 text-green-700 font-bold">₹{b.pricing?.totalAmount || "-"}</td>
                    <td className="px-4 py-2"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-2 flex gap-2">
                      {b.status === "pending" && (
                        <button className="bg-green-600 hover:bg-green-700 text-white rounded-md px-3 py-1 text-xs font-semibold flex items-center gap-1">
                          <FaCheckCircle /> Approve
                        </button>
                      )}
                      {b.status !== "completed" && (
                        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-1 text-xs font-semibold flex items-center gap-1">
                          <FaClock /> Mark Completed
                        </button>
                      )}
                      {b.status !== "cancelled" && (
                        <button className="bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-1 text-xs font-semibold flex items-center gap-1">
                          <FaTimesCircle /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bookings.length === 0 && (
            <div className="owner-panel-empty-state">
              <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3af.svg" alt="No bookings" />
              <div className="title">No bookings found.</div>
              <div className="desc">Try adjusting your filters or check back later.</div>
            </div>
          )}
        </section>
        <Toaster position="top-right" />
        {showModal && (
          <BookingDetailsModal
            booking={selectedBooking}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    </div>
  );
}
