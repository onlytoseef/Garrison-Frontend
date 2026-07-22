import React from "react";
import { Chart, registerables } from "chart.js";
import { useEffect, useRef } from "react";
import PropTypes from "prop-types";

Chart.register(...registerables);

const PieChart = ({ present, total, title = "Attendance Overview" }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");

    // Destroy previous chart instance if exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Present", "Absent"],
        datasets: [
          {
            data: [present, total - present],
            backgroundColor: [
              "rgba(75, 192, 192, 0.6)",
              "rgba(255, 99, 132, 0.6)",
            ],
            borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              padding: 20,
              font: {
                size: 14,
              },
            },
          },
          title: {
            display: !!title,
            text: title,
            font: {
              size: 16,
            },
            padding: {
              bottom: 20,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.raw || 0;
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [present, total, title]);

  return (
    <div className="w-full" style={{ height: "350px" }}>
      <canvas ref={chartRef} />
    </div>
  );
};

PieChart.propTypes = {
  present: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  title: PropTypes.string,
};

export default PieChart;

