import React from "react";
import PropTypes from "prop-types";
import Barcode from "react-barcode";
import { API_BASE_URL } from "../../config/api";

const NAVY = "#2F5DAA";
const NAVY_DARK = "#1E3F72";
const NAVY_LIGHT = "#1E3F72";

// Professional portrait ID card — CR80 scale (54mm x 85.6mm) enlarged for print clarity.
const StudentCard = ({ student }) => {
  if (!student) return null;

  const classLabel = student.classId
    ? `${student.classId.grade} - ${student.classId.section}`
    : "—";
  const photoUrl = student.photo ? `${API_BASE_URL}${student.photo}` : null;

  return (
    <div
      id="printable-student-card"
      style={{
        width: "54mm",
        height: "92mm",
        margin: "0 auto",
        borderRadius: "4mm",
        overflow: "hidden",
        background: "#ffffff",
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        fontFamily: "'Poppins', sans-serif",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #e5eaf2",
        position: "relative",
      }}
    >
      {/* Header band */}
      <div
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_LIGHT} 100%)`,
          color: "#fff",
          padding: "3mm 2mm 2.5mm",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3mm", fontWeight: 700, letterSpacing: "0.3px", lineHeight: 1.1 }}>
          THE QUAID-E-AZAM GROUP OF SCHOOLS & COLLEGES
        </div>
        <div style={{ fontSize: "1.9mm", opacity: 0.9, marginTop: "0.5mm" }}>
          STUDENT IDENTITY CARD
        </div>
      </div>

      {/* Photo */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "3mm" }}>
        <div
          style={{
            width: "22mm",
            height: "26mm",
            borderRadius: "2mm",
            overflow: "hidden",
            border: `1.2mm solid ${NAVY}`,
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={student.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: "8mm", color: "#cbd5e1" }}>👤</span>
          )}
        </div>
      </div>

      {/* Name */}
      <div
        style={{
          textAlign: "center",
          fontSize: "3.4mm",
          fontWeight: 700,
          color: NAVY_DARK,
          marginTop: "2mm",
          padding: "0 2mm",
          lineHeight: 1.1,
        }}
      >
        {student.name}
      </div>
      <div style={{ textAlign: "center", fontSize: "2.3mm", color: "#718096", marginBottom: "1.5mm" }}>
        Class {classLabel}
      </div>

      {/* Details */}
      <div style={{ padding: "0 4mm", fontSize: "2.3mm", color: "#2d3748", flex: 1 }}>
        <Row label="Roll No" value={student.rollNumber} />
        <Row label="Student ID" value={student.studentId} />
        <Row label="Guardian" value={student.guardianName} />
        <Row label="Phone" value={student.guardianPhone} />
      </div>

      {/* Barcode (encodes student ID) */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1.5mm 2mm 3mm",
          marginTop: "1mm",
          background: "#fff",
        }}
      >
        <Barcode
          value={String(student.studentId || "0")}
          format="CODE128"
          width={1.4}
          height={38}
          fontSize={11}
          margin={0}
          displayValue={true}
        />
      </div>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      borderBottom: "0.2mm solid #eef2f7",
      padding: "0.8mm 0",
    }}
  >
    <span style={{ color: "#718096", fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, textAlign: "right", maxWidth: "60%", wordBreak: "break-word" }}>
      {value || "—"}
    </span>
  </div>
);

Row.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

StudentCard.propTypes = {
  student: PropTypes.shape({
    name: PropTypes.string,
    studentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rollNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    guardianName: PropTypes.string,
    guardianPhone: PropTypes.string,
    photo: PropTypes.string,
    classId: PropTypes.shape({
      grade: PropTypes.string,
      section: PropTypes.string,
    }),
  }),
};

export default StudentCard;
