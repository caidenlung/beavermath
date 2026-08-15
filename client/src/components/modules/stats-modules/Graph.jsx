import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Graph = ({ scores = [] }) => {
  const data = useMemo(
    () => ({
      labels: scores.map((_, index) => `${index + 1}`),
      datasets: [
        {
          label: "Score",
          data: scores,
          fill: false,
          borderColor: "rgb(251, 146, 60)",
          backgroundColor: "rgba(251, 146, 60, 0.1)",
          tension: 0.1,
          pointRadius: scores.length > 40 ? 2 : 5,
          pointHoverRadius: 8,
          pointBackgroundColor: "rgb(251, 146, 60)",
          pointHoverBackgroundColor: "rgb(251, 146, 60)",
          pointBorderColor: "rgb(28, 25, 23)",
          pointHoverBorderColor: "rgb(28, 25, 23)",
          pointBorderWidth: 2,
          pointHoverBorderWidth: 3,
        },
      ],
    }),
    [scores]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "rgb(214, 211, 209)",
            font: { family: "monospace" },
          },
        },
        title: {
          display: true,
          text: "score history",
          color: "rgb(214, 211, 209)",
          font: {
            size: 14,
            family: "monospace",
            weight: "500",
          },
        },
        tooltip: {
          backgroundColor: "rgb(41, 37, 36)",
          titleColor: "rgb(214, 211, 209)",
          bodyColor: "rgb(251, 146, 60)",
          titleFont: { family: "monospace", size: 12 },
          bodyFont: { family: "monospace", size: 14, weight: "bold" },
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (context) => context[0].label,
            label: (context) => `Score: ${context.raw}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "scores",
            color: "rgb(214, 211, 209)",
            font: { family: "monospace" },
          },
          grid: {
            color: "rgba(214, 211, 209, 0.1)",
            borderColor: "rgb(68, 64, 60)",
          },
          ticks: {
            color: "rgb(214, 211, 209)",
            font: { family: "monospace" },
            precision: 0,
          },
        },
        x: {
          title: {
            display: true,
            text: "game number",
            color: "rgb(214, 211, 209)",
            font: { family: "monospace" },
          },
          grid: { display: false },
          ticks: {
            color: "rgb(214, 211, 209)",
            font: { family: "monospace" },
            maxTicksLimit: 12,
          },
        },
      },
      interaction: {
        intersect: false,
        mode: "nearest",
      },
    }),
    []
  );

  return (
    <div className="w-full h-[260px] sm:h-[320px]">
      <Line key={scores.length} data={data} options={options} />
    </div>
  );
};

export default Graph;
