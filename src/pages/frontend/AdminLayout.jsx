import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Avatar, Dropdown, Modal, Drawer } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  ReadOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CalendarOutlined,
  FileTextOutlined,
  LogoutOutlined,
  DollarOutlined,
  CloseOutlined,
  SolutionOutlined,
  EditOutlined,
  BookOutlined,
} from "@ant-design/icons";

import { AiOutlineRobot } from "react-icons/ai";
import { motion } from "framer-motion";
import logo from "../../assets/images/logo.png";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../store/slices/authSlice";
import "./AdminLayout.css";

const { Header, Footer, Sider, Content } = Layout;

const menuItems = [
  { key: "/", icon: <HomeOutlined />, label: "Dashboard", path: "/" },
  { key: "/staff", icon: <TeamOutlined />, label: "Staff", path: "/staff" },
  {
    key: "/students",
    icon: <UserOutlined />,
    label: "Students",
    path: "/students",
  },
  {
    key: "/classes",
    icon: <ReadOutlined />,
    label: "Classes",
    path: "/classes",
  },
  {
    key: "/student-attendance",
    icon: <CalendarOutlined />,
    label: "Attendance",
    path: "/student-attendance",
  },
  {
    key: "/attendance-record",
    icon: <FileTextOutlined />,
    label: "Attendance Records",
    path: "/attendance-record",
  },
  {
    key: "/manual-attendance",
    icon: <EditOutlined />,
    label: "Manual Attendance",
    path: "/manual-attendance",
  },
  // { key: "/student-list", icon: <DollarOutlined />, label: "Fee Management", path: "/student-list" },
  {
    key: "/exams",
    icon: <SolutionOutlined />,
    label: "Examinations",
    path: "/exams",
  },
  {
    key: "/diary",
    icon: <BookOutlined />,
    label: "Homework Diary",
    path: "/diary",
  },
  // { key: "/chatbot", icon: <AiOutlineRobot />, label: "QA Assistant", path: "/chatbot" },
];

const AdminLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isCopyrightModalVisible, setIsCopyrightModalVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/auth/login");
  };

  const showCopyrightModal = () => {
    setIsCopyrightModalVisible(true);
  };

  const handleCopyrightModalClose = () => {
    setIsCopyrightModalVisible(false);
  };

  return (
    <Layout style={{ minHeight: "100vh", fontFamily: "Poppins, sans-serif" }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="dark"
          width={250}
          collapsedWidth={80}
          trigger={null}
          style={{
            background: "var(--sidebar-bg, #1E3F72)",
            boxShadow: "2px 0 8px rgba(0, 0, 0, 0.15)",
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            height: "100vh",
          }}
        >
          <div
            className="logo m-15"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "16px 0",
              minHeight: "100px",
            }}
          >
            {collapsed ? (
              <img
                src={logo}
                alt="Logo"
                style={{
                  width: "40px",
                  height: "40px",
                  transition: "all 0.3s ease",
                }}
              />
            ) : (
              <img
                src={logo}
                alt="Logo"
                style={{
                  width: "130px",
                  height: "auto",
                  transition: "all 0.3s ease",
                }}
              />
            )}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{
              background: "transparent",
              borderRight: "none",
              flex: 1,
            }}
          >
            {menuItems.map((item) => (
              <Menu.Item
                key={item.path}
                icon={item.icon}
                style={{
                  margin: "8px 0",
                  borderRadius: "8px",
                  transition: "all 0.3s ease",
                  backgroundColor:
                    location.pathname === item.path ? "var(--sidebar-active, #2F5DAA)" : "transparent",
                }}
              >
                <Link to={item.path}>{item.label}</Link>
              </Menu.Item>
            ))}
          </Menu>
          <div
            style={{
              padding: "16px",
              background: "var(--sidebar-active, #2F5DAA)",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
              position: "sticky",
              bottom: 0,
              left: 0,
              right: 0,
            }}
            onClick={handleLogout}
          >
            <LogoutOutlined style={{ color: "#fff", fontSize: "18px" }} />
            {!collapsed && (
              <span style={{ color: "#fff", marginLeft: "8px" }}>Logout</span>
            )}
          </div>
        </Sider>
      )}

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        bodyStyle={{ padding: 0, background: "#1E3F72" }}
        headerStyle={{ background: "var(--sidebar-bg, #1E3F72)", borderBottom: "1px solid var(--sidebar-active, #2F5DAA)" }}
        width={220}
        className="lg:hidden"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px 0",
            background: "var(--sidebar-bg, #1E3F72)",
          }}
        >
          <img src={logo} alt="Logo" style={{ width: "150px", height: "auto" }} />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ background: "#1E3F72", borderRight: "none" }}
          onClick={() => setMobileDrawerOpen(false)}
        >
          {menuItems.map((item) => (
            <Menu.Item
              key={item.path}
              icon={item.icon}
              style={{
                margin: "8px 0",
                borderRadius: "8px",
                backgroundColor: location.pathname === item.path ? "#2F5DAA" : "transparent",
              }}
            >
              <Link to={item.path}>{item.label}</Link>
            </Menu.Item>
          ))}
        </Menu>
        <div
          style={{
            padding: "16px",
            background: "var(--sidebar-active, #2F5DAA)",
            textAlign: "center",
            cursor: "pointer",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          }}
          onClick={() => {
            setMobileDrawerOpen(false);
            handleLogout();
          }}
        >
          <LogoutOutlined style={{ color: "#fff", fontSize: "18px" }} />
          <span style={{ color: "#fff", marginLeft: "8px" }}>Logout</span>
        </div>
      </Drawer>

      <Layout 
        className="site-layout transition-all duration-300"
        style={{ 
          minHeight: "100vh",
          marginLeft: isMobile ? 0 : (collapsed ? 80 : 250)
        }}
      >
        <Header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 12px",
            background: "var(--sidebar-bg, #1E3F72)",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            position: "sticky",
            top: 0,
            zIndex: 99,
          }}
        >
          <div className="flex items-center gap-2">
            {/* Single Toggle Button - changes icon based on state */}
            <Button
              type="text"
              icon={
                isMobile ? (
                  <MenuUnfoldOutlined />
                ) : collapsed ? (
                  <MenuUnfoldOutlined />
                ) : (
                  <MenuFoldOutlined />
                )
              }
              onClick={() => {
                if (isMobile) {
                  setMobileDrawerOpen(true);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              style={{ color: "#fff", fontSize: isMobile ? "18px" : "16px" }}
            />
            {/* Mobile Logo */}
            <img 
              src={logo} 
              alt="Logo" 
              className="lg:hidden h-8 w-auto"
            />
          </div>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="profile" onClick={() => navigate("/profile")}>
                  Profile
                </Menu.Item>
                <Menu.Item key="logout" onClick={handleLogout}>
                  Logout
                </Menu.Item>
              </Menu>
            }
            trigger={["click"]}
          >
            <Avatar
              icon={<UserOutlined />}
              style={{
                cursor: "pointer",
                backgroundColor: "var(--color-primary, #2F5DAA)",
                color: "#fff",
              }}
            />
          </Dropdown>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
        <Footer
          style={{
            textAlign: "center",
            background: "var(--sidebar-bg, #1E3F72)",
            color: "#fff",
            padding: "16px",
            boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
            fontSize: "14px",
          }}
        >
          <div onClick={showCopyrightModal} style={{ cursor: "pointer" }}>
            © 2025 The Quaid-e-Azam Group of Schools & Colleges
          </div>
        </Footer>

        {/* Copyright Modal */}
        <Modal
          visible={isCopyrightModalVisible}
          onCancel={handleCopyrightModalClose}
          footer={null}
          closeIcon={<CloseOutlined style={{ color: "var(--color-primary, #2F5DAA)" }} />}
          centered
          width={window.innerWidth < 768 ? "95%" : 800}
          bodyStyle={{ padding: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                  Copyright Information
                </h2>
                <div className="w-16 sm:w-20 h-1 bg-[#2F5DAA] mx-auto mt-2"></div>
              </div>

              <div className="prose prose-sm sm:prose-lg text-gray-700">
                <p className="font-semibold text-sm sm:text-base">
                  Under Pakistani Copyright Law (Copyright Ordinance, 1962 as
                  amended):
                </p>
                <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-xs sm:text-base">
                  <li>
                    All content, design, graphics, and software associated with
                    The Quaid-e-Azam Group of Schools & Colleges are protected under copyright law.
                  </li>
                  <li>
                    Unauthorized reproduction, distribution, or modification of
                    any materials is strictly prohibited.
                  </li>
                  <li>
                    The school's name, logo, and all related indicia are
                    trademarks of The Quaid-e-Azam Group of Schools & Colleges.
                  </li>
                  <li>
                    Legal action may be taken against any infringement of these
                    rights.
                  </li>
                </ul>

                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-100 rounded-lg">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                    Permissions
                  </h3>
                  <p className="text-xs sm:text-base">
                    For permissions to use any materials, please contact the
                    school administration at:
                    <br />
                    <span className="font-medium">
                      info@quaideazamschools.edu.pk
                    </span>
                  </p>
                </div>

                <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500">
                  <p>
                    This copyright notice is provided in accordance with Section
                    54 of the Copyright Ordinance, 1962 of Pakistan.
                    <br />
                    Developed by{" "}
                    <a target="_blank" href="http://wa.me/+923186444059">
                      Toseef Rana
                    </a>
                  </p>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 flex justify-center">
                <button
                  onClick={handleCopyrightModalClose}
                  className="px-4 sm:px-6 py-2 bg-[#2F5DAA] text-white text-sm sm:text-base rounded-md hover:bg-[#1E3F72] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </Modal>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
