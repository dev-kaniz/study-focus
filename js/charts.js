/* Chart.js graphs with neon gradients */
const Charts = (() => {
  Chart.defaults.color = '#7d85b0';
  Chart.defaults.borderColor = 'rgba(255,255,255,.06)';
  Chart.defaults.font.family = "'JetBrains Mono', monospace";

  const palette = ['#00f0ff', '#b14dff', '#ff2e88', '#2effa0', '#ffd22e'];

  let line, bar, doughnut, radar;

  function gradient(ctx, color) {
    const g = ctx.createLinearGradient(0, 0, 0, 200);
    g.addColorStop(0, color + '99');
    g.addColorStop(1, color + '00');
    return g;
  }

  function init() {
    // Line — focus minutes last 7 days
    const lc = document.getElementById('lineChart').getContext('2d');
    line = new Chart(lc, {
      type: 'line',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets: [{
          label: 'Focus min',
          data: [45, 90, 60, 120, 75, 150, 100],
          borderColor: '#00f0ff',
          backgroundColor: gradient(lc, '#00f0ff'),
          fill: true, tension: 0.4, pointBackgroundColor: '#00f0ff',
          pointBorderColor: '#fff', borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,.05)' } }
        }
      }
    });

    // Bar — subjects
    bar = new Chart(document.getElementById('barChart'), {
      type: 'bar',
      data: {
        labels: ['Math','Sci','Eng','Hist','Code'],
        datasets: [{
          data: [120, 90, 60, 45, 150],
          backgroundColor: palette.map(c => c + 'cc'),
          borderRadius: 6, borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,.05)' } }
        }
      }
    });

    // Doughnut — time split
    doughnut = new Chart(document.getElementById('doughnutChart'), {
      type: 'doughnut',
      data: {
        labels: ['Work', 'Break', 'Distraction'],
        datasets: [{
          data: [65, 20, 15],
          backgroundColor: ['#00f0ff', '#2effa0', '#ff2e88'],
          borderColor: 'rgba(0,0,0,.2)', borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } }
      }
    });

    // Radar — focus quality
    radar = new Chart(document.getElementById('radarChart'), {
      type: 'radar',
      data: {
        labels: ['Focus', 'Consistency', 'Speed', 'Accuracy', 'Stamina'],
        datasets: [{
          label: 'Today',
          data: [80, 65, 70, 85, 60],
          borderColor: '#b14dff',
          backgroundColor: 'rgba(177,77,255,.25)',
          pointBackgroundColor: '#b14dff', borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            angleLines: { color: 'rgba(255,255,255,.08)' },
            grid: { color: 'rgba(255,255,255,.08)' },
            pointLabels: { font: { size: 9 } },
            suggestedMin: 0, suggestedMax: 100,
            ticks: { display: false }
          }
        }
      }
    });
  }

  function updateLineData(d) { line.data.datasets[0].data = d; line.update(); }
  function updateBarData(v) { bar.data.datasets[0].data = v; bar.update(); }
  function updateDoughnut(w, b, x) { doughnut.data.datasets[0].data = [w, b, x]; doughnut.update(); }
  function updateRadar(v) { radar.data.datasets[0].data = v; radar.update(); }

  return { init, updateLineData, updateBarData, updateDoughnut, updateRadar };
})();

window.addEventListener('load', () => Charts.init());
