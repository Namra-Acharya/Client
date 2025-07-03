import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseURL } from "../utils/apiBase";

const Profile = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${baseURL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(res.data.user.name);
        setEmail(res.data.user.email);
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${baseURL}/api/auth/profile`, { name, email }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditing(false);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile.');
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-gray-950 overflow-hidden px-4">
      {/* Animated background shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-500 opacity-20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-500 opacity-10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-blue-400 opacity-10 rounded-full blur-2xl animate-pulse-slow" />
      </div>
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/10 flex flex-col items-center animate-fadeIn">
        <h2 className="text-2xl font-bold text-center text-white tracking-tight mb-6">Profile</h2>
        {loading ? (
          <div className="text-center text-lg text-white">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-400">{error}</div>
        ) : editing ? (
          <form onSubmit={handleSave} className="w-full flex flex-col gap-6">
            <div className="flex flex-col gap-2 w-full">
              <label className="text-white/80 font-medium">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-white/20 bg-white/10 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-transform" />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <label className="text-white/80 font-medium">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border border-white/20 bg-white/10 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-transform" />
            </div>
            <button type="submit" className="w-full py-2 font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 shadow-md mt-2">Save</button>
          </form>
        ) : (
          <div className="w-full flex flex-col items-center gap-4">
            <p className="text-lg text-white"><strong>Name:</strong> {name}</p>
            <p className="text-lg text-white"><strong>Email:</strong> {email}</p>
            <button onClick={() => setEditing(true)} className="mt-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow transition">Edit</button>
          </div>
        )}
        {message && <p className="text-green-400 text-center mt-4">{message}</p>}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fadeIn { animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1) both; }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
        .animate-pulse-slow { animation: pulse-slow 6s infinite alternate; }
      `}</style>
    </div>
  );
};

export default Profile; 