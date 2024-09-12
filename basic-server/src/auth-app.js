const fastify = require("fastify")
const fastifySwagger = require("@fastify/swagger")
const fastifySwaggerUI = require("@fastify/swagger-ui")
const fastifyPostgres  = require("@fastify/postgres")
const fastifyJwt  = require("@fastify/jwt")
const fastifyBcrypt = require("fastify-bcrypt")

const apiGateway = require("./routes/v1/api-gateway")

const build = (opts={}, swaggerOpts={}, swaggerUIOpts={}, fastifyPostgresOpts = {}, fastifyJwtOpts = {}, fastifyBcryptOpts = {}) => {
    const app = fastify(opts)
    app.register(fastifySwagger, swaggerOpts)
    app.register(fastifySwaggerUI, swaggerUIOpts)
    app.register(fastifyPostgres, fastifyPostgresOpts)
    app.register(fastifyJwt, fastifyJwtOpts)
    app.register(fastifyBcrypt, fastifyBcryptOpts)
    app.register(apiGateway, {prefix: '/auth'})
    return app
}

module.exports = build