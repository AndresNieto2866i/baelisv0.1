const fs = require('fs')

const express = require('express');
const routes = require('./routes/chatwood-hook');

class ServerHttp {
    app;
    providerWs;

    constructor(providerWs, carpeta, puerto) {
        this.providerWs = providerWs;
        this.carpeta = carpeta
        this.puerto = puerto
    }



    async buildApp() {
        console.log(typeof this.puerto)

        try {
            this.app = express()
                .use(express.json())
                .use((req, _, next) => {
                    req.providerWs = this.providerWs
                    next()
                })
                .use(routes)
                .listen(parseInt(this.puerto), () => console.log(`${this.puerto}`))

        } catch (error) {
            console.log(error)
        }
    }

    async start() {
        console.log('corriendo en:', this.puerto)
        await this.buildApp();
    }
    closeServer() {
        if (this.app) {
            this.app.close(() => {
                console.log(`Server on port ${this.port} is closed.`);
            });
        } else {
            console.error('No se pudo cerrar el servidor porque no está inicializado.');
        }
    }
}

module.exports = ServerHttp;
