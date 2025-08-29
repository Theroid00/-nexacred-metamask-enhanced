import Header from "./components/Header";
import React, { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import AuthModal from "./components/AuthModal";
import useMetaMask from './hooks/useMetaMask';
import Hero from "./components/Hero";
import TrustBadges from "./components/TrustBadges";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import WhyNexaCred from "./components/WhyNexaCred";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const navigate = useNavigate();
  
  // MetaMask wallet integration
  const wallet = useMetaMask();
  const [walletUser, setWalletUser] = useState(null);

  // Register API
  const handleRegister = async (form) => {
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Registration successful! Please login.');
        setAuthOpen(true);
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (err) {
      alert('Registration error');
    }
  };

  // Enhanced Login API (supports both traditional and wallet auth)
  const handleLogin = async (loginData) => {
    try {
      let res, data;
      
      if (loginData.walletAddress) {
        // Wallet authentication - data already includes token and user
        setToken(loginData.token);
        localStorage.setItem('token', loginData.token);
        setUser(loginData.user);
        setWalletUser({ address: loginData.walletAddress });
        setAuthOpen(false);
        navigate('/dashboard');
        return;
      } else {
        // Traditional username/password authentication
        res = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: loginData.username, password: loginData.password })
        });
        data = await res.json();
        
        if (res.ok) {
          setToken(data.token);
          localStorage.setItem('token', data.token);
          setUser(data.user);
          setWalletUser(null); // Clear wallet user for traditional login
          setAuthOpen(false);
          navigate('/dashboard');
        } else {
          alert(data.error || 'Login failed');
        }
      }
    } catch (err) {
      alert('Login error: ' + err.message);
    }
  };

  // Enhanced Logout
  const handleLogout = () => {
    setUser(null);
    setWalletUser(null);
    setToken('');
    localStorage.removeItem('token');
    wallet.disconnectWallet();
  };

  return (
    <>
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
      <Routes>
        <Route
          path="/dashboard"
          element={
            <Dashboard 
              user={user} 
              wallet={wallet}
              walletUser={walletUser}
              token={token}
            />
          }
        />
        <Route
          path="/"
          element={
            <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-950 text-white">
              <Header user={user} handleLogout={handleLogout} setAuthOpen={setAuthOpen} />
              <Hero />
              <TrustBadges />
              <Features />
              <HowItWorks />
              <WhyNexaCred />
              <CTA />
              <Footer />
            </main>
          }
        />
      </Routes>
    </>
  );
}
