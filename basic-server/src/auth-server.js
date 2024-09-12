const build = require('./auth-app')
const env = require("./config/env")

const app = build(
    {logger:true},
    {
        mode: "dynamic",
        openapi: {
            openapi: "3.0.0",
            info: {
                title: "Auth API",
                description: "Authentication server",
                version: "0.1.0"
            },
            servers: [{
                url: "https://improved-meme-xg946gggjq2vrgq-3001.app.github.dev/",
                description: "Development Server"
            }]
        }
    },
    {
        routePrefix: "/docs",
        uiConfig: {
            docExpansion: "full",
            deeplinking: false
        }
    },
    {
        connectionString: env.POSTGRES_DB_CONNECTION
    },
    {
        secret: env.AUTH_SECRET
    },
    {
        saltWorkFactor: 12
    }
)

app.listen ({port:3001, host: "localhost"},(err) => {
    if (err) {
        app.log.error(err)
        process.exit(1);
    }   
})