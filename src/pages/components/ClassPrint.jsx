import React from "react";
import moment from "moment";
import { Divider } from "antd";
import logo from "../../assets/images/logo.png";

const ClassPrint = ({ classData }) => {
  // Ensure students data exists and has the expected structure
  const students = classData.students || [];

  return (
    <div
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        padding: "0",
        backgroundColor: "#ffffff",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
      }}
    >
      {/* Header Section */}
      <div style={{ margin: "10mm 0 5mm 0", textAlign: "center" }}>
        <img src={logo} alt="School Logo" style={{ width: "60px" }} />
        <h1
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "#243F73",
            margin: "5px 0",
          }}
        >
          GARRISON SCHOOL SYSTEM
        </h1>
        <p style={{ fontSize: "12px", color: "#4b5563", margin: 0 }}>
          SHERONWALA PULL, JARANWALA
        </p>
      </div>

      <div style={{ textAlign: "center", marginBottom: "15px" }}>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: "#243F73",
            color: "#ffffff",
            padding: "4px 0",
            display: "inline-block",
            width: "100%",
            maxWidth: "250px",
            margin: "0 auto",
          }}
        >
          CLASS DETAILS
        </h2>
      </div>

      {/* Class Info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "5px",
          marginBottom: "15px",
          fontSize: "12px",
          padding: "0 10mm",
        }}
      >
        {/* Class information fields */}
        <div>
          <strong>Grade:</strong> {classData.grade}
        </div>
        <div>
          <strong>Section:</strong> {classData.section}
        </div>
        <div>
          <strong>Room:</strong> {classData.roomNumber || "N/A"}
        </div>
        <div>
          <strong>In-charge:</strong> {classData.inCharge || "N/A"}
        </div>
        <div>
          <strong>Total Students:</strong> {students.length}
        </div>
        <div>
          <strong>Date:</strong> {moment().format("DD/MM/YYYY")}
        </div>
      </div>

      <Divider
        orientation="left"
        style={{ fontSize: "12px", margin: "0 10mm" }}
      >
        Students List
      </Divider>

      {/* Student Table */}
      <div style={{ margin: "0", padding: "0 10mm" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            margin: "0",
            padding: "0",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#243F73", color: "#ffffff" }}>
              <th style={{ padding: "5px", width: "5%" }}>S.No</th>
              <th style={{ padding: "5px", width: "10%" }}>Roll No</th>
              <th style={{ padding: "5px", width: "15%" }}>Student ID</th>
              <th style={{ padding: "5px", width: "25%" }}>Student Name</th>
              <th style={{ padding: "5px", width: "10%" }}>Gender</th>
              <th style={{ padding: "5px", width: "20%" }}>Father Name</th>
              <th style={{ padding: "5px", width: "15%" }}>Contact</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student, index) => (
                <tr key={student._id || index}>
                  <td style={{ padding: "5px", textAlign: "center" }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: "5px", textAlign: "center" }}>
                    {student.rollNumber || "N/A"}
                  </td>
                  <td style={{ padding: "5px", textAlign: "center" }}>
                    {student.studentId || "N/A"}
                  </td>
                  <td style={{ padding: "5px" }}>{student.name || "N/A"}</td>
                  <td style={{ padding: "5px", textAlign: "center" }}>
                    {student.gender || "N/A"}
                  </td>
                  <td style={{ padding: "5px" }}>
                    {student.guardianName || "N/A"}
                  </td>
                  <td style={{ padding: "5px", textAlign: "center" }}>
                    {student.guardianPhone || "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: "5px", textAlign: "center" }}>
                  No students found in this class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 10mm",
          marginTop: "15px",
          borderTop: "1px solid #000",
          paddingTop: "10px",
        }}
      >
        <div>Class In-charge</div>
        <div>Principal</div>
      </div>
    </div>
  );
};

export default ClassPrint;

