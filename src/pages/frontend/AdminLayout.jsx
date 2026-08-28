import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Avatar, Dropdown, Modal, Drawer } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  EyeOutlined,
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
  FolderOpenOutlined,
  FileSearchOutlined,
  SwapOutlined,
} from "@ant-design/icons";

import { AiOutlineRobot } from "react-icons/ai";
import { motion } from "framer-motion";
import axios from "axios";
import logo from "../../assets/images/logo.webp";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../store/slices/authSlice";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { isReadOnlyRole } from "../../utils/permissions";
import { getActiveCampusId, setActiveCampusId } from "../../config/axiosSetup";
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
  // Not in TEACHER_PATHS below, so teachers never see it — the API refuses
  // them anyway.
  { key: "/fees", icon: <DollarOutlined />, label: "Fees", path: "/fees" },
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
  {
    key: "/resources",
    icon: <FolderOpenOutlined />,
    label: "Resources",
    path: "/resources",
  },
  {
    key: "/logs",
    icon: <FileSearchOutlined />,
    label: "Activity Logs",
    path: "/logs",
  },
  // { key: "/chatbot", icon: <AiOutlineRobot />, label: "QA Assistant", path: "/chatbot" },
];

/**
 * What a teacher may reach. Everything else is refused by the API anyway, so
 * showing it would only produce dead links and 403s.
 *
 * Base is five items: Dashboard, Classes (read-only), Exams (enter their
 * subject's marks), Diary and Resources. A teacher who is assigned ANY class
 * additionally gets Manual Attendance, so they can mark that class's register —
 * a subject teacher may now do this too, not only a class in-charge. That item
 * is appended once they have at least one assigned class. The student list,
 * fees, attendance records and the QR scan feed stay absent.
 */
const TEACHER_PATHS = ["/", "/classes", "/exams", "/diary", "/resources"];
const TEACHER_ATTENDANCE_PATHS = [...TEACHER_PATHS, "/manual-attendance"];

/**
 * What an academic head may reach. Like the super admin they work across
 * campuses, but their data is scoped to a grade band and excludes money and
 * audit: no Fees, no Attendance Records / QR feed, no Activity Logs, no user
 * management. Staff is present but read-only (the API refuses their writes), and
 * Manual Attendance lets them mark their band's registers.
 */
const ACADEMIC_HEAD_PATHS = [
  "/",
  "/staff",
  "/students",
  "/classes",
  "/manual-attendance",
  "/exams",
  "/diary",
  "/resources",
];

// Human labels for the band shown in the campus banner.
const BAND_LABEL = {
  primary: "Primary (Play Group–5)",
  middle: "Middle (6–8)",
  matric: "Matric (9–10)",
  intermediate: "Intermediate (11–12)",
};

/**
 * Height of the "viewing campus" top bar, in px.
 *
 * A constant because two places must agree on it: the bar's own height, and the
 * Header's sticky `top`. If they drift, the header either overlaps the bar or
 * leaves a gap under it while scrolling.
 */
const CAMPUS_BAR_H = 44;

const menuItemsForRole = (role, hasAnyClass) => {
  if (role === "teacher") {
    const paths = hasAnyClass ? TEACHER_ATTENDANCE_PATHS : TEACHER_PATHS;
    return menuItems.filter((item) => paths.includes(item.path));
  }
  if (role === "academic_head") {
    return menuItems.filter((item) => ACADEMIC_HEAD_PATHS.includes(item.path));
  }
  return menuItems;
};

const AdminLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isCopyrightModalVisible, setIsCopyrightModalVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // A super admin, and now an academic head, browse a campus they don't own, so
  // both get the "you are inside campus X" banner and a way back to the picker.
  // The academic head's banner also names their grade band.
  const isSuperAdmin = user?.role === "super_admin";
  const isAcademicHead = user?.role === "academic_head";
  const canSwitchCampus = isSuperAdmin || isAcademicHead;
  // A principal has read-only access — surface it in the header so the mode is
  // obvious on every page (the write controls themselves are hidden per page).
  const isReadOnly = isReadOnlyRole(user?.role);
  const [campusName, setCampusName] = useState("");

  // A teacher who is assigned any class gets the Manual Attendance nav item —
  // they may mark that class's register (subject teacher or in-charge alike).
  // We learn that from /teacher/my-classes, the same endpoint the page uses, so
  // the sidebar never disagrees with what they can actually open.
  const [hasAnyClass, setHasAnyClass] = useState(false);

  // Teachers get a reduced sidebar; the API refuses the rest regardless, so
  // rendering those links would only produce dead ends.
  const visibleMenuItems = menuItemsForRole(user?.role, hasAnyClass);

  useEffect(() => {
    if (user?.role !== "teacher") return;
    let alive = true;
    axios
      .get(API_ENDPOINTS.TEACHER_MY_CLASSES)
      .then((res) => {
        if (alive) setHasAnyClass((res.data || []).length > 0);
      })
      .catch(() => {
        // A failure here just leaves attendance hidden; the API still guards it.
      });
    return () => {
      alive = false;
    };
  }, [user?.role]);

  useEffect(() => {
    if (!canSwitchCampus) return;
    const campusId = getActiveCampusId();
    if (!campusId) return;

    axios
      .get(`${API_BASE_URL}/api/campuses`)
      .then((res) => {
        const active = res.data.find((c) => c._id === campusId);
        if (active) setCampusName(`${active.name} (${active.code})`);
      })
      .catch(() => {
        // Banner is informational; a failure here must not block the layout.
      });
  }, [canSwitchCampus]);

  const exitCampus = () => {
    setActiveCampusId(null);
    navigate("/campuses");
  };

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
    setActiveCampusId(null);
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
      {/* Super admins and academic heads are browsing a campus they don't own —
          make that obvious, and give them one click back to the picker. The
          academic head's bar also states their grade band, so it is clear the data
          on screen is limited to it.

          FIXED and at the outermost level, spanning the sidebar too. It began life
          as a strip inside <Content>, which indented it with the page and scrolled
          it away — wrong for something that says "everything you see belongs to
          another campus". Sitting inside the inner <Layout> was not enough either:
          that layout carries a marginLeft for the sidebar, so the bar started after
          it.

          Because it is out of flow, the Sider and the inner Layout are pushed down
          by exactly its height (CAMPUS_BAR_H) — otherwise it would cover the top of
          the sidebar logo and the header. */}
      {canSwitchCampus && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: CAMPUS_BAR_H,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "0 18px",
            background:
              "linear-gradient(100deg, #2F5DAA 0%, #1E3F72 55%, #16325C 100%)",
            color: "#fff",
            // Bottom corners only: the bar is flush with the top of the window, so
            // rounding the top edge would leave two slivers of page above it.
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
            boxShadow: "0 4px 16px rgba(30,63,114,0.32)",
            // Above the Sider (which antd puts at 100 when fixed) and the Header.
            zIndex: 1002,
          }}
        >
          <span
            style={{
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            <EyeOutlined style={{ fontSize: 13, opacity: 0.7 }} />
            <span style={{ opacity: 0.72 }} className="hidden sm:inline">
              Viewing campus
            </span>
            <strong
              style={{
                fontSize: 13.5,
                letterSpacing: 0.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {campusName || "Loading…"}
            </strong>
            {isAcademicHead && user?.academicBand && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 9px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.16)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  whiteSpace: "nowrap",
                }}
              >
                {BAND_LABEL[user.academicBand] || user.academicBand}
              </span>
            )}
          </span>

          <button
            onClick={exitCampus}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              flexShrink: 0,
              height: 30,
              padding: "0 14px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.28)",
              background: "rgba(255,255,255,0.13)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.18s, border-color 0.18s, color 0.18s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.color = "#1E3F72";
              e.currentTarget.style.borderColor = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.13)";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
            }}
          >
            <SwapOutlined style={{ fontSize: 12 }} />
            <span className="hidden sm:inline">Switch campus</span>
            <span className="sm:hidden">Switch</span>
          </button>
        </div>
      )}

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
            // Starts below the campus bar so the bar can span the full width
            // without covering the sidebar's logo.
            top: canSwitchCampus ? CAMPUS_BAR_H : 0,
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
            {visibleMenuItems.map((item) => (
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
          {visibleMenuItems.map((item) => (
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
          marginLeft: isMobile ? 0 : (collapsed ? 80 : 250),
          // The campus bar is fixed and out of flow, so the page has to make room
          // for it or the header would start underneath it.
          marginTop: canSwitchCampus ? CAMPUS_BAR_H : 0,
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
            // Pushed below the campus bar when it is showing, so the two stick
            // one under the other instead of on top of each other.
            top: canSwitchCampus ? CAMPUS_BAR_H : 0,
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
          <div className="flex items-center gap-3">
            {isReadOnly && (
              <span
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
                title="Your account has read-only access"
              >
                <EyeOutlined />
                Read-only
              </span>
            )}
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
          </div>
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
            © {new Date().getFullYear()} The Quaid-e-Azam Group of Schools & Colleges
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
