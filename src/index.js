
require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const limiter = require('express-rate-limit')
require('./db/Connect')
const { notFound, errorHandler } = require('./utils/errors')
const route = require('./routes/route')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

app.use(limiter({
    windowMs : 5000,
    max : 5
}))


const port = process.env.PORT || 3000

app.use('/', route)

app.use(notFound)
app.use(errorHandler)

app.listen(port,
    () => console.log(`server is up and running...`)
)