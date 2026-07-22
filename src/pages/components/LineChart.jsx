import React from "react";
import { Chart, registerables } from "chart.js";
import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
Chart.register(...registerables);

const LineChart = ({
  labels,
  paid,
  pending,
  title = "Daily Fee Collection",
  days = 30,
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
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Daily Collected Fees",
            data: paid,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            tension: 0.3,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
          {
            label: "Daily Pending Fees",
            data: pending,
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            tension: 0.3,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
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
            display: true,
            text: `${title} (Last ${days} Days)`,
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
              text: "Amount (Rs.)",
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
              text: "Date",
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
  }, [labels, paid, pending, title, days]);

  return (
    <div className="w-full" style={{ height: "400px" }}>
      <canvas ref={chartRef} />
    </div>
  );
};

LineChart.propTypes = {
  labels: PropTypes.array.isRequired,
  paid: PropTypes.array.isRequired,
  pending: PropTypes.array.isRequired,
  title: PropTypes.string,
  days: PropTypes.number,
};

export default LineChart;

