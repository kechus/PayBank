var dictionary = {
  'payment': "Pago",
  'purchase': "Compra"
}

async function getData() {
  let option = {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      accountId: sessionStorage.getItem('accountId')
    })
  }
  let data = await fetch('/history', option);
  let json = await data.json();

  console.log(json);
  if (json.state == "not-logged") {
    window.location.href = '../login/login.html';
  } else {
    populateTable(json.value);
  }
}


function populateTable(data) {
  let table = document.getElementById('table-body');
  let row;
  let cell = [];
  let date;

  for (let i = 0; i < data.length; i++) {
    row = table.insertRow(i);
    for (let j = 0; j < 6; j++) {
      cell[j] = row.insertCell(j);
    }

    date = data[i].date.split(' ');
    cell[0].innerHTML = data[i].transaction_id;
    cell[1].innerHTML = data[i].origin_username;
    cell[2].innerHTML = data[i].destiny_username;
    cell[3].innerHTML = data[i].ammount;
    cell[4].innerHTML = dictionary[data[i].type];
    cell[5].innerHTML = date[0] + " " + date[1];
  }
}

function goBack() {
  window.location.href = '../landing';
}