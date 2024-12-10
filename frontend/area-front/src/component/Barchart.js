import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Enregistrement des composants
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Données
const data = {
    labels: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    datasets: [
        {
            label: 'Youtube',
            data: [12, 19, 3, 5, 2, 3, 10, 15, 20, 25, 30, 35],
            fill: true,
            backgroundColor: 'red',
            borderColor: 'red',
        },
        {
            label: 'Spotify',
            data: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37],
            fill: true,
            backgroundColor: 'lightgreen',
            borderColor: 'lightgreen',
        },
        {
            label: 'Gmail',
            data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            fill: true,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
        },
        {
            label: 'Github',
            data: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23],
            fill: true,
            backgroundColor: 'rgba(128, 128, 128, 0.2)',
            borderColor: 'rgba(128, 128, 128, 1)',
        },
        {
            label: 'Discord',
            data: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
            fill: true,
            backgroundColor: 'rgba(0, 0, 255, 0.2)',
            borderColor: 'rgba(0, 0, 255, 1)',
        },
        {
            label: 'X',
            data: [1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45],
            fill: true,
            backgroundColor: 'darkgray',
            borderColor: 'darkgray',
        }
    ],
};

// Options
const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
  },
};

const AreaLineChart = () => {
  return <Line data={data} options={options} />;
};

export default AreaLineChart;
