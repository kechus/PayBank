async function sendData() {
  let username = document.getElementById('username').value;
  let password = document.getElementById('password').value;
  let hashPass = CryptoJS.MD5(password);
  let credtiCard = document.getElementById('credit-card').value;

  const data = {
    'username': username,
    'password': hashPass.toString(),
    'card': credtiCard
  }

  const options = {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(data)
  }

  let response = await fetch('/register', options);
  let values = await response.json();

  if (values.state == 'success') {
    window.location.href = "login.html";
  } else {
    document.getElementById('register-state').innerHTML = "Se ha producido un error, vuelve a intentarlo"
  }
}

function loaded() {
  let bigNumber = Math.floor(Math.random() * 1E16);
  document.getElementById('credit-card').value = bigNumber.toString();
}