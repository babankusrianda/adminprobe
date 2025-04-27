$(document).ready(function() {
  $('#loginBtn').click(function() {
    const username = $('#username').val();
    const password = $('#password').val();
    if (!username || !password) {
      toastr.error('Username and Password must be filled');
      return;
    }

    $.ajax({
      url: 'https://idn.arve.tech/login',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ username, password }),
      success: function(res) {
        localStorage.setItem('token', res.token);
        toastr.success('Login Success');
        setTimeout(() => {
          window.location.href = 'country.html';
        }, 1000);
      },
      error: function() {
        toastr.error('Login Failed! Please check username or password.');
      }
    });
  });
});
