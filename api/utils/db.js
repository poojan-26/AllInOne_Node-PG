const promise = require('bluebird')
const { Client } = require('pg')

const config = require('./config')

let connection


class DB {
  async getConnection() {
    return new promise((resolve, reject) => {
      connection = new Client({
        host: config.db.host,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
      });
      connection.connect((err) => {
        if (err) {
          console.error('error connecting: ' + err.stack)
          reject('Error while connectiong database !')
        }
        console.log(`connected to ${config.db.database} as id ${connection.processID}`)
        resolve('Database Connected !')
      })
    })
  }

  select(table, selectParams, condition) {
    return new promise((resolve, reject) => {
      let query = `SELECT ${selectParams} FROM ${table}`
      if (condition) {
        query += ` WHERE ${condition}`
      }
      console.log('\n\n', query, '\n\n')
      connection.query(query, (error, results) => {
        if (error) {
          console.log(error)
          reject('DB_ERROR')
        } else {
          resolve(results.rows)
        }
      })
    })
  }

  insert(table, data) {
    return new promise((resolve, reject) => {
      let query = `INSERT INTO ${table}(${Object.keys(data).join(',')}) VALUES(${Object.keys(data).map((d, index) => ('$' + (index + 1)))}) RETURNING *`,
        values = Object.values(data)
      console.log("query", query)
      connection.query(query, values, (error, results) => {
        console.log(query)
        if (error) {
          console.log(error)
          reject('DB_ERROR')
        } else {
          resolve(results.rows[0])
        }
      })
    })
  }

  update(table, condition, data) {
    return new promise((resolve, reject) => {
      let query = `UPDATE ${table} SET ${Object.entries(data).map(entry =>
        (entry[0] + '=' + ((entry[1] == null ? entry[1] : "'" + entry[1] + "'"))))} WHERE ${condition}`
      console.log("query", query)
      connection.query(query, (error, results) => {
        if (error) {
          console.log(error)
          reject('DB_ERROR')
        } else {
          resolve(results)
        }
      })
    })
  }

  upsert(table, data, conflict_key) {
    return new promise((resolve, reject) => {
      let query = `INSERT INTO ${table}(${Object.keys(data).join(',')}) VALUES( 
                  ${Object.values(data).map(d => ("'" + d + "'"))}) ON CONFLICT 
                  (${conflict_key}) DO UPDATE SET 
                  ${Object.entries(data).map(entry => (entry[0] + '=' + "'" + entry[1] + "'"))} RETURNING   ${conflict_key}`
      console.log("\n\n\n\n\n\n\n\n upsert ::: ", query);
      connection.query(query, (error, results) => {
        if (error) {
          console.log(error)
          reject('DB_ERROR')
        } else {
          console.log("upsert result ::: ", results);
          resolve(results)
        }
      })
    })
  }

  delete(table, condition) {
    return new promise((resolve, reject) => {
      let query = `DELETE FROM ${table} WHERE ${condition}`
      connection.query(query, (error, results) => {
        if (error) {
          console.log(error)
          reject('DB_ERROR')
        } else {
          resolve(results)
        }
      })
    })
  }

  custom(query) {
    return new promise((resolve, reject) => {
      console.log("\n\n\n Custom query ================ ", query);
      connection.query(query, (error, results) => {
        if (error) {
          console.log(error)
          reject('DB_ERROR')
        } else {
          resolve(results)
        }
      })
    })
  }

  bulkinsert(table, fields, values, condition, updvalues) {
    return new promise((resolve, reject) => {
      let query = ''
      if (condition != '') {
        query = `INSERT INTO ${table} ${fields} VALUES ${values} ON CONFLICT (${condition}) DO UPDATE SET  ${updvalues} `
      } else {
        query = `INSERT INTO ${table} ${fields} VALUES ${values} ON CONFLICT DO NOTHING `
      }
      console.log("query", query)
      connection.query(query, (error, results) => {
        if (error) {
          console.log(error)
          reject('DB_ERROR')
        } else {
          resolve(results.rows[0])
        }
      })
    })
  }
}



module.exports = new DB()
