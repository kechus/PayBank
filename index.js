const express = require('express');
const async = require('async');
const session = require('express-session');
const db = require('./server_side/database_handler.js');

const app = express();
app.listen(3000, () => console.log('Listening!'));

process.env.TZ = "America/Mexico_City";

app.use(express.static('public'));
app.use(express.json());

app.use(session({
  name: "sid",
  resave: false,
  saveUninitialized: false,
  secret: 'pass',
  cookie: {
    maxAge: 1000 * 60 * 60 * 2,
    sameSite: true,
    secure: false,

  }
}))

const checkLogin = (request, response, next) => {
  if (!request.session.userId) {
    response.json({
      state: 'not-logged'
    });
  } else {
    next();
  }
}

app.post('/login', (request, response) => {
  const databaseHandler = new db();
  let data = request.body;

  let statement = `SELECT account_id FROM account WHERE username = "${data.username}" AND password = "${data.password}"`;

  databaseHandler.select(statement, (error, rows) => {
    let state = loginState(error, rows, request);
    console.log('tried login:' + state.state);
    if (state.state == 'success') {
      request.session.userId = rows[0].account_id;
    }
    response.json(state);
    databaseHandler.endConnection();
  });
});

function loginState(error, rows, request) {
  let status;
  if (error) {
    console.error(error);
    status = 'error';
  } else {
    if (rows.length == 1) {
      status = 'success'
    } else
      status = 'unsuccessful';
  }
  return {
    state: status
  };
}

app.post('/register', (request, response) => {
  const databaseHandler = new db();
  const data = request.body;
  let state;

  let values = [
    [data.username, data.password, data.card]
  ];

  let statement = "INSERT INTO account(username,password,credit_card) VALUES ?";

  databaseHandler.insert(statement, values, (error, results) => {
    state = insertState(error, results, 'account');
    response.json({
      state: state
    });
    databaseHandler.endConnection();
  });

});

function insertState(error, rows, table) {
  let status;

  if (error) {
    console.error(error);
    status = 'error';
  } else {
    console.log(`${rows.affectedRows} rows affected in ${table}`);
    status = 'success';
  }

  return status;
}

app.get('/info', checkLogin, (request, response) => {
  const dbHandler = new db();

  let statement = `SELECT balance,credit_card,username 
  FROM account 
  WHERE account_id = ${request.session.userId}`;

  dbHandler.select(statement, (error, rows) => {
    let state = landingState(error);
    response.json({
      state: state,
      rows: rows
    });
  });
});

function landingState(error) {
  let state;
  if (error) {
    console.error(error)
    state = "error";
    console.log("retrieving unsuccessful");
  } else {
    console.log("retrieving successful");
    state = "success";
  }

  return state;

}

app.post('/loan', checkLogin, (request, response) => {
  let data = request.body;
  let oAccountId;
  let dAccountId;

  if (data.type == 'payment') {
    oAccountId = request.session.userId
    dAccountId = 10
  } else {
    oAccountId = 10
    dAccountId = request.session.userId
  }

  let values = [
    [oAccountId, dAccountId, 'ongoing', 'payment', data.ammount]
  ]

  async.series([
      async.apply(insertTransaction, values),
        async.apply(getBalance, oAccountId, dAccountId)
    ],
    (err, results) => {
      if (results[1].oBalance < data.ammount) {
        console.log("Insuffcient balance");
        response.json({
          state: "failed"
        })
      } else {
        let ammount = parseFloat(data.ammount);
        let ids = {
          dId: dAccountId,
          oId: oAccountId,
          iId: results[0]
        }
        completeTransaction(ids, ammount, results[1]);
        console.log("Transaction completed");
        response.json({
          state: "success"
        });
      }
    });


});

function completeTransaction(ids, ammount, balances) {
  updateBalance(ids, ammount, balances);
  updateTransaction(ids.iId);
}

function updateTransaction(iId) {
  const dbHandler = new db();
  let statement = "UPDATE transaction SET status = 'completed' WHERE transaction_id =" + iId;
  dbHandler.select(statement, (error, results) => {
    if (error)
      console.error(error)
  })
  let date = new Date();
  let datetime = date.getFullYear() + "-" +
    (date.getMonth() + 1) + "-" +
    date.getDate() + " " +
    date.getHours() + ":" +
    date.getMinutes() + ":" +
    date.getSeconds();

  let values = [
    [iId, datetime]
  ]

  statement = "INSERT INTO completed_transaction(transaction_id,date) VALUES ?";
  dbHandler.insert(statement, values, (error, results) => {
    if (error)
      console.error(error)
  })
}

function updateBalance(ids, ammount, balances, callback) {
  const dbHandler = new db();
  async.series([
    (callback) => {
      let newBalance = balances.oBalance - ammount;
      let statement = `UPDATE account SET balance = ${newBalance} WHERE account_id = ${ids.oId}`;
      dbHandler.select(statement, (error, results) => {
        if (error)
          callback(error, null)
        else
          callback(null, results)
      })
    },
    (callback) => {
      let newBalance = balances.dBalance + ammount;
      let statement = `UPDATE account SET balance = ${newBalance} WHERE account_id = ${ids.dId}`;
      dbHandler.select(statement, (error, results) => {
        if (error)
          callback(error, null)
        else
          callback(null, results)
      })
    }
  ], (error, results) => {
    console.log("Balances updated");
  });
}

function insertTransaction(values, callback) {
  const dbHandler = new db();
  let insertQ = `INSERT INTO transaction(origin_account_id, destination_account_id, status, type, ammount) 
        VALUES ?`;

  dbHandler.insert(insertQ, values, (error, rows) => {
    if (error)
      callback(error, null);
    else
      callback(null, rows.insertId)
  });
}

function getBalance(oId, dId, callback) {
  const dbHandler = new db();
  async.series([
    (callback) => {
      let statement = `SELECT balance FROM account WHERE account_id = ${oId}`
      dbHandler.select(statement, (error, results) => {
        if (error)
          callback(error, null)
        else
          callback(null, results[0].balance)
      })
    },
    (callback) => {
      let statement = `SELECT balance FROM account WHERE account_id = ${dId}`
      dbHandler.select(statement, (error, results) => {
        if (error)
          callback(error, null)
        else
          callback(null, results[0].balance)
      })
    }
  ], (error, results) => {
    let ids = {
      oBalance: results[0],
      dBalance: results[1]
    }
    callback(error, ids);
  });

}

app.post('/history', checkLogin, (request, response) => {
  const dbHandler = new db();
  let id = request.session.userId;
  let data = {};
  let options = {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    },
    formatter = new Intl.DateTimeFormat([], options);

  let statement = `SELECT 
  t.transaction_id, 
  o.username AS 'origin_username', 
  d.username AS 'destiny_username', 
  ct.date, 
  t.type, 
  t.ammount
  FROM completed_transaction AS ct
  INNER JOIN transaction AS t
  ON ct.transaction_id = t.transaction_id
  AND (t.origin_account_id = ${id} OR t.destination_account_id = ${id})
  INNER JOIN account AS o ON t.origin_account_id = o.account_id
  INNER JOIN account as d ON t.destination_account_id = d.account_id
  ORDER BY ct.date DESC`;


  dbHandler.select(statement, (error, results) => {
    if (error) {
      console.error(error);
      data.state = "error";
    } else {
      data.state = "successful"
      results.forEach(row => {
        row.date = formatter.format(row.date);
      });
      data.value = results;
      console.log("Transactions retrieved succesfully");
    }

    response.json(data)
  });
});

app.post('/logout', (request, response) => {
  request.session.destroy((error) => {
    if (error) {
      return response.redirect('/landing');
    }

    response.clearCookie('sid');
    response.redirect("/login/login.html");
  })
});