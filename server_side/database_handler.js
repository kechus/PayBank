const mysql = require('mysql');

module.exports = class databaseHandler {

  constructor() {

    this.connection = mysql.createConnection({
      host: 'localhost',
      database: 'paybank',
      user: 'root',
      password: ''
    });

    this.connection.connect(function (error) {
      if (error)
        throw error;
    });
  }

  select(query, callback) {
    this.connection.query(query, (error, results, fields) => {
      if (error)
        callback(error, null);
      else
        callback(null, results);

    });
  }

  insert(query, values, callback) {
    this.connection.query(query, [values], (error, results) => {
      if (error)
        callback(error, null);
      else
        callback(null, results);
    });
  }

  endConnection() {
    this.connection.end();
  }

}