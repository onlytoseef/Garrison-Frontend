import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Avatar, Drawer } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  HomeOutlined,
  BarChartOutlined,
  CalendarOutlined,
  BookOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import logo from "../../assets/images/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../store/slices/authSlice";
import "../frontend/AdminLayout.css";

const { Header, Footer, Sider, Content } = Layout;

const menuItems = [
  { key: "/parent", icon: <HomeOutlined />, label: "Dashboard", path: "/parent" },
  { key: "/parent/results", icon: <BarChartOutlined />, label: "Exam Results", path: "/parent/results" },
  { key: "/parent/attendance", icon: <CalendarOutlined />, label: "Attendance", path: "/parent/attendance" },
  { key: "/parent/diary", icon: <BookOutlined />, label: "Homework Diary", path: "/parent/diary" },
];

const ParentLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setMobileDrawerOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const token = JSON.parse(localStorage.getItem("authState"))?.token;

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get(API_ENDPOINTS.PARENT_NOTIFICATIONS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      await axios.put(API_ENDPOINTS.PARENT_NOTIFICATIONS_READ, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/auth/login");
  };

  const notifTypeIcon = (type) => {
    if (type === "result") return "📊";
    if (type === "diary") return "📖";
    if (type === "attendance") return "⚠️";
    return "🔔";
  };

  return (
    <Layout style={{ minHeight: "100vh", fontFamily: "Poppins, sans-serif" }}>
      {!isMobile && (
        <Sider
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="dark"
          width={250}
          collapsedWidth={80}
          trigger={null}
          style={{
            background: "#1B315D",
            boxShadow: "2px 0 8px rgba(0, 0, 0, 0.15)",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            height: "100vh",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px 0", height: "64px" }}>
            <img src={logo} alt="Logo" style={{ width: collapsed ? "30px" : "150px", height: "auto", transition: "all 0.3s ease" }} />
          </div>
          <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} style={{ background: "transparent", borderRight: "none", flex: 1 }}>
            {menuItems.map((item) => (
              <Menu.Item key={item.path} icon={item.icon} style={{ margin: "8px 0", borderRadius: "8px", backgroundColor: location.pathname === item.path ? "#243F73" : "transparent" }}>
                <Link to={item.path}>{item.label}</Link>
              </Menu.Item>
            ))}
          </Menu>
          <div
            style={{ padding: "16px", background: "#DC2626", textAlign: "center", cursor: "pointer", position: "sticky", bottom: 0 }}
            onClick={handleLogout}
          >
            <LogoutOutlined style={{ color: "#fff", fontSize: "18px" }} />
            {!collapsed && <span style={{ color: "#fff", marginLeft: "8px" }}>Logout</span>}
          </div>
        </Sider>
      )}

      <Drawer placement="left" onClose={() => setMobileDrawerOpen(false)} open={mobileDrawerOpen} bodyStyle={{ padding: 0, background: "#1B315D" }} headerStyle={{ background: "#1B315D", borderBottom: "1px solid #365896" }} width={220}>
        <div style={{ display: "flex", justifyContent: "center", padding: "20px 0", background: "#1B315D" }}>
          <img src={logo} alt="Logo" style={{ width: "150px", height: "auto" }} />
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} style={{ background: "#1B315D", borderRight: "none" }} onClick={() => setMobileDrawerOpen(false)}>
          {menuItems.map((item) => (
            <Menu.Item key={item.path} icon={item.icon} style={{ margin: "8px 0", borderRadius: "8px", backgroundColor: location.pathname === item.path ? "#243F73" : "transparent" }}>
              <Link to={item.path}>{item.label}</Link>
            </Menu.Item>
          ))}
        </Menu>
        <div style={{ padding: "16px", background: "#DC2626", textAlign: "center", cursor: "pointer", position: "absolute", bottom: 0, left: 0, right: 0 }} onClick={() => { setMobileDrawerOpen(false); handleLogout(); }}>
          <LogoutOutlined style={{ color: "#fff", fontSize: "18px" }} />
          <span style={{ color: "#fff", marginLeft: "8px" }}>Logout</span>
        </div>
      </Drawer>

      <Layout className="site-layout transition-all duration-300" style={{ minHeight: "100vh", marginLeft: isMobile ? 0 : (collapsed ? 80 : 250) }}>
        <Header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 12px", background: "#1B315D", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", position: "sticky", top: 0, zIndex: 99 }}>
          <div className="flex items-center gap-2">
            <Button
              type="text"
              icon={isMobile ? <MenuUnfoldOutlined /> : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => isMobile ? setMobileDrawerOpen(true) : setCollapsed(!collapsed)}
              style={{ color: "#fff", fontSize: isMobile ? "18px" : "16px" }}
            />
            <img src={logo} alt="Logo" className="lg:hidden h-8 w-auto" />
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <BellOutlined style={{ fontSize: "20px" }} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                  <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-100">
                    <div className="px-4 py-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #243F73 0%, #365896 100%)" }}>
                      <span className="text-white font-bold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-white/80 hover:text-white text-xs">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">No notifications</div>
                      ) : (
                        notifications.slice(0, 20).map((n) => (
                          <div key={n._id} className={`px-4 py-3 border-b border-gray-50 ${!n.read ? "bg-blue-50/50" : ""}`}>
                            <div className="flex items-start gap-2">
                              <span className="text-lg">{notifTypeIcon(n.type)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                                <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(n.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                              {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Avatar icon={<UserOutlined />} style={{ cursor: "pointer", backgroundColor: "#243F73", color: "#fff" }} />
          </div>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
        <Footer style={{ textAlign: "center", background: "#1B315D", color: "#fff", padding: "16px", fontSize: "14px" }}>
          © 2025 Garrison School System — Parent Portal
        </Footer>
      </Layout>
    </Layout>
  );
};

export default ParentLayout;
