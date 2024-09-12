const build = require('./app')
const env = require("./config/env")

const app = build(
    {logger:true},
    {
        mode: "dynamic",
        openapi: {
            openapi: "3.0.0",
            info: {
                title: "Library API",
                description: "Library management",
                version: "0.1.0"
            },
            servers: [{
                url: "https://improved-meme-xg946gggjq2vrgq-3000.app.github.dev/",
                description: "Development Server"
            }],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            },
            security: [
                {
                    bearerAuth: []  // Applica il Bearer token globalmente
                }
            ]
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
    }
)

app.listen ({port:3000, host: "localhost"},(err) => {
    if (err) {
        app.log.error(err)
        process.exit(1);
    }   
})