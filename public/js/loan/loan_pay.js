async function pagar() {
  let values = {
    ammount: document.getElementById("ammount").value,
    dAccountId: 10,
    type: 'payment'
  }
  let option = {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(values)
  }
  let data = await fetch('/loan', option);
  let json = await data.json();

  if (json.state == 'failed')
    alert("saldo insuficiente");

  window.location.href = '../landing';
}