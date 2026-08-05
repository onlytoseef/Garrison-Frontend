import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, addUser, deleteUser } from "../../store/slices/userSlice";
import { FaTrash, FaPlus } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const Users = () => {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.users);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "admin",
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value) => {
    setFormData({ ...formData, role: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(addUser(formData));
    setFormData({ email: "", password: "", role: "admin" });
  };

  const showDeleteModal = (userId) => {
    setSelectedUserId(userId);
    setIsModalVisible(true);
  };

  const handleDelete = () => {
    dispatch(deleteUser(selectedUserId));
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => <span className="capitalize">{role}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
          onClick={() => showDeleteModal(record._id)}
        >
          <FaTrash />
        </motion.button>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-[#1E3F72]/10 p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 max-w-4xl w-full mx-auto"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Manage Users
        </h1>

        <motion.form
          onSubmit={handleSubmit}
          className="mb-6 flex flex-wrap gap-4 justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <select
            value={formData.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="principal">Principal</option>
          </select>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center bg-blue-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-600 transition-all"
          >
            <FaPlus className="mr-2" />
            Add User
          </motion.button>
        </motion.form>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="min-w-full bg-transparent">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 transition-all"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                        {user.role}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                          onClick={() => showDeleteModal(user._id)}
                        >
                          <FaTrash />
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {isModalVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="glass-card p-6 w-11/12 max-w-md"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Confirm Deletion
              </h2>
              <p className="text-gray-700">
                Are you sure you want to delete this user?
              </p>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setIsModalVisible(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Users;

