import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchStaff,
  deleteStaff,
  addStaff,
  updateStaff,
} from "../../store/slices/staffSlice";
import { fetchClasses } from "../../store/slices/classSlice";
import { motion } from "framer-motion";
import { Modal, Form, Input, Select, Typography } from "antd";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaUser,
  FaPhone,
  FaHome,
  FaGraduationCap,
  FaMoneyBill,
  FaKey,
  FaIdBadge,
  FaIdCard,
  FaFileExcel,
} from "react-icons/fa";
import TeacherAccessModal from "../components/TeacherAccessModal";
import ImportStaffModal from "../components/ImportStaffModal";

const { Option } = Select;
const { Title } = Typography;

const Staff = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { staff, status } = useSelector((state) => state.staff);
  const { classes } = useSelector((state) => state.classes);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  // Staff member whose portal access is being managed.
  const [accessStaff, setAccessStaff] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchStaff());
    // Needed for the class checkboxes in the access modal.
    dispatch(fetchClasses());
  }, [dispatch]);

  const handleDelete = (id) => {
    dispatch(deleteStaff(id));
  };

  const handleAdd = () => {
    setEditingStaff(null);
    setIsModalVisible(true);
  };

  const handleEdit = (staff) => {
    setEditingStaff(staff);
    form.setFieldsValue(staff);
    setIsModalVisible(true);
  };

  const handleNameClick = (record) => {
    navigate(`/staff/${record._id}`);
  };

  const handleModalSubmit = async (values) => {
    if (editingStaff) {
      await dispatch(
        updateStaff({ id: editingStaff._id, formData: values })
      ).unwrap();
    } else {
      await dispatch(addStaff(values)).unwrap();
    }
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: "Employee ID",
      dataIndex: "employeeId",
      key: "employeeId",
      align: "center",
      render: (text) => text || "—",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      align: "center",
      render: (text, record) => (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-blue-600 cursor-pointer"
          onClick={() => handleNameClick(record)}
        >
          {text}
        </motion.div>
      ),
    },
    { title: "Role", dataIndex: "role", key: "role", align: "center" },
    { title: "Phone", dataIndex: "phone", key: "phone", align: "center" },
    { title: "Salary", dataIndex: "salary", key: "salary", align: "center" },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <div className="flex justify-center space-x-2">
          {/* Portal access only makes sense for roles that can hold a login;
              a peon or guard has nothing to sign in for. */}
          {["teacher", "principal", "admin"].includes(record.role) && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="bg-amber-500 text-white px-3 py-2 rounded-lg flex items-center space-x-2"
              onClick={() => setAccessStaff(record)}
              title="Login and class assignments"
            >
              <FaKey />
              <span>Access</span>
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-blue-500 text-white px-3 py-2 rounded-lg flex items-center space-x-2"
            onClick={() => handleEdit(record)}
          >
            <FaEdit />
            <span>Edit</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-red-500 text-white px-3 py-2 rounded-lg flex items-center space-x-2"
            onClick={() => handleDelete(record._id)}
          >
            <FaTrash />
            <span>Delete</span>
          </motion.button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-6 md:p-8 bg-white min-h-screen"
    >
      <Title
        level={2}
        className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-6 sm:mb-8"
      >
        Staff Management
      </Title>
      <hr className="border-t-2 border-gray-200 mb-6 sm:mb-8" />
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6 sm:mb-8">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center space-x-2"
          onClick={handleAdd}
        >
          <FaPlus />
          <span>Add Staff</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="bg-white text-gray-700 border border-gray-300 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 transition-all flex items-center space-x-2"
          onClick={() => setIsImportOpen(true)}
          title="Import staff from an Excel or CSV file"
        >
          <FaFileExcel className="text-green-600" />
          <span>Import</span>
        </motion.button>
      </div>
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-[#2F5DAA] to-[#1E3F72] text-white">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider"
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {staff.map((record, index) => (
                <tr
                  key={record._id}
                  className={`${
                    index % 2 === 0 ? "bg-white/40" : "bg-white/20"
                  } hover:bg-gray-100 transition-all`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700"
                    >
                      {column.render
                        ? column.render(record[column.dataIndex], record)
                        : record[column.dataIndex]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      <Modal
        title={editingStaff ? "Edit Staff" : "Add Staff"}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        destroyOnClose
        className="rounded-lg"
      >
        <Form form={form} onFinish={handleModalSubmit} layout="vertical">
          <Form.Item
            name="employeeId"
            label="Employee ID"
            rules={[
              { required: true, message: "Please enter the employee ID" },
            ]}
          >
            <Input
              prefix={<FaIdBadge className="text-gray-400" />}
              placeholder="e.g. EMP-001"
            />
          </Form.Item>
          <Form.Item
            name="cnic"
            label="CNIC"
            rules={[{ required: true, message: "Please enter the CNIC" }]}
            normalize={(value) => (value || "").replace(/[^0-9-]/g, "")}
          >
            <Input
              prefix={<FaIdCard className="text-gray-400" />}
              maxLength={15}
              placeholder="e.g. 3310402314266 or 33104-2314266-7"
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter the name" }]}
          >
            <Input prefix={<FaUser className="text-gray-400" />} />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              { required: true, message: "Please enter the phone number" },
            ]}
          >
            <Input prefix={<FaPhone className="text-gray-400" />} />
          </Form.Item>
          <Form.Item name="address" label="Address (optional)">
            <Input prefix={<FaHome className="text-gray-400" />} />
          </Form.Item>
          <Form.Item name="education" label="Education (optional)">
            <Input prefix={<FaGraduationCap className="text-gray-400" />} />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Please select the role" }]}
          >
            <Select placeholder="Select a role">
              <Option value="admin">Admin</Option>
              <Option value="principal">Principal</Option>
              <Option value="teacher">Teacher</Option>
              <Option value="security guard">Security Guard</Option>
              <Option value="peon">Peon</Option>
              <Option value="others">Others</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="salary"
            label="Salary (optional)"
          >
            <Input
              prefix={<FaMoneyBill className="text-gray-400" />}
              type="number"
              placeholder="Leave blank if not set yet"
            />
          </Form.Item>
        </Form>
      </Modal>

      {accessStaff && (
        <TeacherAccessModal
          staff={accessStaff}
          classes={classes}
          onClose={() => setAccessStaff(null)}
        />
      )}

      {isImportOpen && (
        <ImportStaffModal
          onClose={() => setIsImportOpen(false)}
          onImported={() => dispatch(fetchStaff())}
        />
      )}
    </motion.div>
  );
};

export default Staff;

