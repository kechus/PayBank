async function cargado() {
  let option = {
    method: "GET"
  }

  let data = await fetch('/info', option);
  let json = await data.json();

  if (json.state == 'not-logged') {
    window.location.href = '../login/login.html';
  } else {
    populateAccount(json)
  }

}

function populateAccount(data) {
  let account = data.rows[0];
  document.getElementById('username').innerHTML = account.username;
  document.getElementById('saldo').innerHTML = account.balance;
  document.getElementById('card').innerHTML = account.credit_card;
}