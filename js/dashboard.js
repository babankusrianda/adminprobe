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
    const requests = countries.map(c => 
  fetch(countryUrls[c], {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  }).then(res => res.json())
);

Promise.allSettled(requests)
  .then(results => {
    const fulfilledResults = results
      .filter(r => r.status === "fulfilled")
      .map(r => r.value); // Ambil value (hasil fetch JSON yang berhasil)

    if (fulfilledResults.length === 0) {
      toastr.error('Failed to fetch counter data');
      $('#loadingSpinner').addClass('d-none');
      return;
    }

    renderChart(fulfilledResults); // Panggil grafik berdasarkan hasil sukses saja
  })
  .catch(() => {
    toastr.error('Unexpected error fetching counter data');
    $('#loadingSpinner').addClass('d-none');
  });

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
