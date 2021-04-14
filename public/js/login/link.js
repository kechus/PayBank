let values = {
  state: false,
  id: 0
};

async function sendData() {
  let username = document.getElementById('username').value;
  let password = document.getElementById('password').value;
  let hashPass = CryptoJS.MD5(password)
  const data = {
    'username': username,
    'password': hashPass.toString()
  }

  const options = {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(data)
  }

  let response = await fetch('/link', options);
  values = await response.json();

  if (values.state !== 'success') {
    document.getElementById('login-state').innerHTML = "Contraseña o usuario incorrecto";
  }
}

window.addEventListener("message", function (ev) {
  ev.source.postMessage(values, "*");
});