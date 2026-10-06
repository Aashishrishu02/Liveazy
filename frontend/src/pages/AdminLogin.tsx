import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL;

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Invalid email or password");
        return;
      }

      // Save admin JWT
      localStorage.setItem("token", data.access_token);

      // Go to dashboard
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5FAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-[#D8EEF0] p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <img
              src="/liveazy-logo.png"
              alt="LIVEAZY Furniture Rental"
              className="w-70 h-50 object-contain"
            />
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-[#123B63] mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              required
              className="w-full h-11 px-4 border border-gray-300 rounded-lg outline-none focus:border-[#0795A3] focus:ring-2 focus:ring-[#0795A3]/10"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-[#123B63] mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full h-11 px-4 border border-gray-300 rounded-lg outline-none focus:border-[#0795A3] focus:ring-2 focus:ring-[#0795A3]/10"
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#123B63] hover:bg-[#0795A3] disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>
      </div>
    </div>
  );
}