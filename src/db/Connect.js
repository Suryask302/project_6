/*                                          connecting MongoDb                                        */

require('dotenv').config()
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true })
    .then(() => console.log(`Mongo-DB Connected`))
    .catch((err) => console.log(err))

mongoose.connection.on(`connected`, _ => {
    console.log(`mongoose Connected To DB`)
})

mongoose.connection.on(`error`, err => {
    console.log(err.message)
})

mongoose.connection.on(`disconnected`, _ => {
    console.log(`mongoose Connection Is Disconnected`)
})

process.on(`SIGINT`, async _ => {
    await mongoose.connection.close()
    process.exit(0)
})
