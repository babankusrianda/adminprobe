$(document).ready(function() {
  // ⛔ Kalau gak ada token, langsung balik ke login
  if (!localStorage.getItem('token')) {
    window.location.href = 'index.html';
    return;
  }

  $('#submitCountry').click(function() {
    const selected = [];
    $('.country:checked').each(function() {
      selected.push($(this).val());
    });

    if (selected.length > 0) {
      localStorage.setItem('selectedCountries', JSON.stringify(selected));
      toastr.success('Country selected!');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      toastr.warning('Please select at least one country!');
    }
  });
});
