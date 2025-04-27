$(document).ready(function() {
  if (!localStorage.getItem('token')) {
    window.location.href = 'index.html';
    return;
  }

  let chart;
  const countryUrls = {
    idn: 'https://idn.arve.tech/counter',
    vnm: 'https://vnm.telev.asia/counter',
    phl: 'https://phl.arve.tech/counter'
  };

  generateMonthOptions();

  function generateMonthOptions() {
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    const today = new Date();
    const select = $('#monthSelector');

    select.empty();
    for (let i = 0; i < 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthNames[date.getMonth()];
      select.append(`<option value="${yearMonth}">${monthName}</option>`);
    }
  }

  function fetchAndRender() {
    const countries = JSON.parse(localStorage.getItem('selectedCountries')) || [];
    if (countries.length === 0) {
      window.location.href = 'country.html';
      return;
    }

    const selectedMonth = $('#monthSelector').val();
    $('#loadingSpinner').removeClass('d-none');
    const requests = countries.map(c => $.get(countryUrls[c]));

    Promise.allSettled(requests)
      .then(results => {
        const labelsSet = new Set();
        const datasets = [];

        results.forEach((res, idx) => {
          const country = countries[idx];
          const dailyValid = [];
          const dailyError = [];

          res.data.forEach(d => {
            const dateObj = new Date(d.date);
            const dateMonth = dateObj.toISOString().slice(0, 7);
            if (dateMonth === selectedMonth) {
              const day = dateObj.getUTCDate();
              labelsSet.add(day);
              dailyValid[day - 1] = d.todayValid || 0;
              dailyError[day - 1] = d.todayError || 0;
            }
          });

          datasets.push({
            label: `${country.toUpperCase()} Valid`,
            data: dailyValid,
            backgroundColor: 'green',
            stack: country
          });

          datasets.push({
            label: `${country.toUpperCase()} Error`,
            data: dailyError,
            backgroundColor: 'red',
            stack: country
          });
        });

        const labels = Array.from(labelsSet).sort((a, b) => a - b).map(d => `${selectedMonth.split('-')[1]}-${String(d).padStart(2, '0')}`);

        if (chart) chart.destroy();

        chart = new Chart($('#barChart'), {
          type: 'bar',
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            responsive: true,
            plugins: { tooltip: { mode: 'index', intersect: false } },
            scales: {
              x: { stacked: true },
              y: { stacked: true, beginAtZero: true }
            },
            animation: { duration: 1000 }
          }
        });

        updateTodayCounter(labels, datasets, selectedMonth);
      })
      .catch(() => {
        toastr.error('Failed to fetch counter data');
      })
      .finally(() => {
        $('#loadingSpinner').addClass('d-none');
      });
  }

  function updateTodayCounter(labels, datasets, selectedMonth) {
  const today = new Date();
  const todayDay = today.getDate();
  const searchDay = `${selectedMonth.split('-')[1]}-${String(todayDay).padStart(2, '0')}`;
  const indexToday = labels.indexOf(searchDay);

  let todayValid = 0;
  let todayError = 0;

  if (indexToday !== -1) {
    datasets.forEach(ds => {
      if (ds.label.includes('Valid')) {
        todayValid += ds.data[indexToday] || 0;
      } else if (ds.label.includes('Error')) {
        todayError += ds.data[indexToday] || 0;
      }
    });
  }

  const validCounter = new CountUp.CountUp('todayValid', todayValid);
  const errorCounter = new CountUp.CountUp('todayError', todayError);

  if (!validCounter.error) validCounter.start();
  if (!errorCounter.error) errorCounter.start();

  const failedRate = todayValid + todayError > 0 ? (todayError / (todayValid + todayError)) * 100 : 0;
  document.getElementById('todayFailedRate').innerText = `(${failedRate.toFixed(2)}% FAILED)`;
}


  fetchAndRender();
  setInterval(fetchAndRender, 5000);

  $('#logoutBtn').click(function() {
    localStorage.clear();
    toastr.info('Logged out');
    setTimeout(() => window.location.href = 'index.html', 1000);
  });

  $('#toggleTheme').click(function() {
    $('body').toggleClass('dark-mode');
    $('.card').toggleClass('bg-dark text-white');
  });

  $('#monthSelector').change(function() {
    fetchAndRender();
  });

  $('#exportChart').click(function() {
    const a = document.createElement('a');
    a.href = chart.toBase64Image();
    a.download = 'counter_probe_chart.png';
    a.click();
  });
});
