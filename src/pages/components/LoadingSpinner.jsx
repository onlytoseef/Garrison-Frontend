import React from "react";
import { motion } from "framer-motion";

const LoadingSpinner = ({
  logo,
  size = 150,
  logoSize = 120,
  speed = 2,
  bgColor = "#F7F9FC",
  spinnerColor = "white",
  shadow = "0 0 20px rgba(0, 0, 0, 0.1)",
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100%",
        backgroundColor: bgColor,
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: shadow,
          backgroundColor: spinnerColor,
        }}
      >
        <img
          src={logo}
          alt="Loading spinner"
          style={{
            width: `${logoSize}px`,
            height: `${logoSize}px`,
            objectFit: "contain",
            userSelect: "none",
          }}
        />
      </motion.div>
    </div>
  );
};

export default LoadingSpinner;

