import { useState } from 'react';

function LoginModal({
  onClose,
  onLoginSuccess,
}: {
  onClose: () => void;
  onLoginSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleLogin = async () => {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    console.log(data);
if (response.ok) {
  localStorage.setItem('token', data.access_token);
  onLoginSuccess();
  onClose();

    } else {
      alert(data.message);
    }
  };

  const handleRegister = async () => {
    const response = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const data = await response.json();

    console.log(data);

    if (response.ok) {
      alert('Registration successful! Please login.');

      setIsRegister(false);
      setName('');
      setEmail('');
      setPassword('');
    } else {
      alert(data.message);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

      <div className="relative w-full max-w-200 rounded-2xl bg-white p-10 shadow-2xl">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-2xl text-gray-500 hover:text-gray-800"
        >
          ×
        </button>

        {/* Logo + Heading */}
        <div className="text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl font-bold text-orange-500">
            R
          </div>

          <h2 className="text-3xl font-bold text-gray-900">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>

          <p className="mt-2 text-base text-gray-500">
            {isRegister
              ? 'Create your RentNest account'
              : 'Login to your RentNest account'}
          </p>

        </div>

        {/* Name - Only Register */}
        {isRegister && (
          <div className="mt-8">

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-orange-500"
            />

          </div>
        )}

        {/* Email */}
        <div className="mt-6">

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Email
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-orange-500"
          />

        </div>

        {/* Password */}
        <div className="mt-6">

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-orange-500"
          />

        </div>

        {/* Login / Register Button */}
        <button
          onClick={isRegister ? handleRegister : handleLogin}
          className="mt-7 w-full rounded-lg bg-orange-500 py-3.5 text-base font-semibold text-white hover:bg-orange-600"
        >
          {isRegister ? 'REGISTER' : 'LOGIN'}
        </button>

        {/* Google */}
        <div className="my-6 flex items-center gap-3">

          <div className="h-px flex-1 bg-gray-200" />

          <span className="text-sm text-gray-400">
            OR
          </span>

          <div className="h-px flex-1 bg-gray-200" />

        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full rounded-lg border border-gray-300 py-3.5 text-base font-medium text-gray-700 hover:bg-gray-50"
        >
          Continue with Google
        </button>

        {/* Register / Login Switch */}
        <p className="mt-7 text-center text-sm text-gray-500">

          {isRegister
            ? 'Already have an account?'
            : "Don't have an account?"}

          <span
            onClick={() => setIsRegister(!isRegister)}
            className="ml-1 cursor-pointer font-semibold text-orange-500"
          >
            {isRegister ? 'Login' : 'Register'}
          </span>

        </p>

      </div>

    </div>
  );
}

export default LoginModal;