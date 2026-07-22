import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../store/slices/authSlice";
import { motion } from "framer-motion";
import { HiMail, HiLockClosed } from "react-icons/hi";
import logo from "../../../src/assets/images/logo.png";
import toast from "react-hot-toast";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    try {
      const result = await dispatch(loginUser(values)).unwrap();
      if (result.user) {
        toast.success("Login successful!");
        navigate("/");
      }
    } catch (err) {
      toast.error(err.message || "Login failed");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{
        backgroundImage:
          "url(https://app.awferalms.com/assets/LMS-BkumTRus.png)",
      }}
    >
      <div className="absolute inset-0 bg-[#1B315D] bg-opacity-50"></div>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-6 sm:p-8 w-full max-w-md relative z-10"
      >
        <div className="flex justify-center mb-6 sm:mb-8">
          <img src={logo} className="w-40 sm:w-60" alt="Logo" />
        </div>
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Welcome Back!</h2>
          <p className="text-sm sm:text-base text-gray-600">You've been missed!</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const values = Object.fromEntries(formData.entries());
            handleLogin(values);
          }}
          className="space-y-5 sm:space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiMail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                required
                className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiLockClosed className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                name="password"
                required
                className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            style={{ backgroundColor: "#243F73" }}
            className="w-full text-white py-2.5 sm:py-3 px-4 text-sm sm:text-base rounded-md hover:bg-opacity-90 transition-all duration-300 cursor-pointer font-medium"
          >
            Sign in
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;

