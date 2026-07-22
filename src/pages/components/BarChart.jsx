import React from "react";
import { Chart, registerables } from "chart.js";
import { useEffect, useRef } from "react";
import PropTypes from "prop-types";

Chart.register(...registerables);

const BarChart = ({
  labels,
  collected,
  pending,
  title = "Monthly Fee Collection",
  xTitle = "Months",
  yTitle = "Amount (Rs.)",
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Collected Fees",
            data: collected,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: "Pending Fees",
            data: pending,
            backgroundColor: "rgba(255, 99, 132, 0.6)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
            borderRadius: 4,
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
                return `${
                  context.dataset.label
                }: Rs. ${context.raw.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: yTitle,
              font: {
                weight: "bold",
              },
            },
            ticks: {
              callback: function (value) {
                return "Rs. " + value.toLocaleString();
              },
            },
          },
          x: {
            title: {
              display: true,
              text: xTitle,
              font: {
                weight: "bold",
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
  }, [labels, collected, pending, title, xTitle, yTitle]);

  return (
    <div className="w-full" style={{ height: "350px" }}>
      <canvas ref={chartRef} />
    </div>
  );
};

BarChart.propTypes = {
  labels: PropTypes.array.isRequired,
  collected: PropTypes.array.isRequired,
  pending: PropTypes.array.isRequired,
  title: PropTypes.string,
  xTitle: PropTypes.string,
  yTitle: PropTypes.string,
};

export default BarChart;

