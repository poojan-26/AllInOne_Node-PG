const express = require('express')
const app = express()
const logger = require('morgan')
const cors = require('cors')
const bodyParser = require('body-parser')

const config = require('./api/utils/config')
const db = require('./api/utils/db')

const v1Routes = require('./routes/V1routes')
const v1RoutesAdmin = require('./routes/V1routesAdmin')
const v1RoutesServiceProvider = require('./routes/V1routesServiceProvider.js')

logger.token('date', () => {
  return new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
})
app.use(logger('[:date[]] :remote-addr ":method :url HTTP/:http-version" :status '))
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }))
app.use(bodyParser.json({ limit: '100mb' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Credentials', true)
  next()
})

app.use('/assets', express.static('assets'))
app.use('/static', express.static('static'))
app.use('/admin-panel', express.static('build'))
app.get('/admin-panel/*', (req, res) => {
  res.sendFile(__dirname + '/build/index.html')
})

app.use('/api/v1', v1Routes)
app.listen(config.port, () => {
  console.log(`Server Started at http://${config.host}:${config.port}`)
})
// db.getConnection()
//   .then(() => {
//     app.listen(config.port, () => {
//       console.log(`Server Started at http://${config.host}:${config.port}`)
//     })
//   })
//   .catch((error) => {
//     console.log(error)
//   })

module.exports = app;