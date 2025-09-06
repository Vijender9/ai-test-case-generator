import React from "react";
import { FaGithub } from "react-icons/fa";
import { api } from "../api";

const Login = () => {
  const handleGitHubLogin = () => {
    window.location.href = "http://localhost:5000/auth/github";
  };

  return (
    <div className="min-h-screen w-screen bg-[#00332B] flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md text-center mx-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Sign in</h1>
        <p className="text-gray-600 mb-6 text-sm">Access your test case generation dashboard</p>
        <button
          onClick={handleGitHubLogin}
          className="flex items-center justify-center gap-3 border border-gray-300 hover:border-gray-700 text-gray-900 font-semibold py-3 px-6 rounded-lg transition w-full shadow-sm hover:shadow-md"
        >
          <FaGithub size={20} />
          Sign in with GitHub
        </button>
      </div>
    </div>
  );
};

export default Login;



