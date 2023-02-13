module.exports = (function () {
  let data = {
    host: "localhost",
    port: 3000,
    user:"root",
    password:""
  }
  if (process.env.NODE_ENV === "production") {
    data.db = {
      host: "tekoto.cavs0mxf0u08.eu-central-1.rds.amazonaws.com",
      user: "tekoto_db",
      password: "TgmKG3O5ZTWP0p2j0a2H0JR3M",
      database: "tekoto"
    }
    data.reset_password_link = `http://localhost:${data.port}/resetPassword/`
  } else {
    data.db = {
      host: "192.168.1.4",
      user: "postgres",
      password: "root123",
      database: "Tekoto"
    }
    data.reset_password_link = `http://192.168.1.14:3000/resetPassword/`
  }
  return data;
})();
