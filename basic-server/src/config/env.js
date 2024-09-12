require("dotenv").config()

const envalid = require("envalid")

module.exports = envalid.cleanEnv(process.env, {
    POSTGRES_DB_CONNECTION: envalid.str({}),
    AUTH_SECRET: envalid.str({})
})