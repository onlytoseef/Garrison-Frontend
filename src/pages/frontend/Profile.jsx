import React, { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { HiUserCircle, HiEye, HiEyeOff } from "react-icons/hi";
import { motion } from "framer-motion";
import { Form, Input, Button } from "antd";

// Campus-based roles reach this page from the sidebar. A super admin does not:
// their home is the campus picker, where the same form is offered as a modal
// (see components/ChangePasswordModal.jsx), so they never have to leave it.
const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form] = Form.useForm();

  const handleUpdatePassword = async (values) => {
    try {
      if (values.newPassword !== values.confirmPassword) {
        toast.error("New password and confirm password do not match");
        return;
      }

      setLoading(true);
      // userId is deliberately NOT sent: the server takes the account from the
      // auth token. Sending it would be ignored, and relying on it was how the
      // old endpoint let one user target another.
      await axios.post(API_ENDPOINTS.UPDATE_PASSWORD, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password updated successfully!");
      form.resetFields();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-gradient-to-b from-[#2F5DAA] to-[#1E3F72] p-6">
        <div className="flex items-center justify-center mb-4 md:mb-8">
          <HiUserCircle className="h-16 w-16 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-sm text-[#1E3F72]">{user.email}</p>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 p-4 sm:p-6 md:p-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">
          Profile Settings
        </h1>

        {/* Update Password Section */}
        <div className="glass-card p-4 sm:p-6 md:p-8 max-w-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
            Update Password
          </h2>

          <Form
            form={form}
            onFinish={handleUpdatePassword}
            className="space-y-6"
          >
            {/* Current Password */}
            <Form.Item
              name="currentPassword"
              rules={[
                {
                  required: true,
                  message: "Please enter your current password!",
                },
              ]}
            >
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F5DAA] focus:border-[#2F5DAA] hover:border-[#1E3F72] transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-[#2F5DAA] transition-all duration-300"
                >
                  {showCurrentPassword ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
            </Form.Item>

            {/* New Password */}
            <Form.Item
              name="newPassword"
              rules={[
                { required: true, message: "Please enter your new password!" },
                {
                  min: 8,
                  message: "Password must be at least 8 characters",
                },
              ]}
            >
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F5DAA] focus:border-[#2F5DAA] hover:border-[#1E3F72] transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-[#2F5DAA] transition-all duration-300"
                >
                  {showNewPassword ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
            </Form.Item>

            {/* Confirm Password */}
            <Form.Item
              name="confirmPassword"
              rules={[
                {
                  required: true,
                  message: "Please confirm your new password!",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match!"));
                  },
                }),
              ]}
            >
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F5DAA] focus:border-[#2F5DAA] hover:border-[#1E3F72] transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-[#2F5DAA] transition-all duration-300"
                >
                  {showConfirmPassword ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
            </Form.Item>

            {/* Update Button */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ backgroundColor: "#2F5DAA" }}
                className="w-full text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-300 cursor-pointer"
              >
                Update Password
              </Button>
            </Form.Item>
          </Form>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;

