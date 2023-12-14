const express = require('express');
const routes = require('./routes/chatwood-hook');
const isPortTaken = require('is-port-taken');

class ServerHttp {
    port = 30000;
    app;
    providerWs;

    constructor(providerWs) {
        this.providerWs = providerWs;
    }

    async findAvailablePort() {
        let currentPort = this.port;
        while (await isPortTaken(currentPort)) {
            currentPort++;
        }
        return currentPort;
    }

    async buildApp() {
        this.port = await this.findAvailablePort();

        this.app = express()
            .use(express.json())
            .use((req, _, next) => {
                req.providerWs = this.providerWs;
                next();
            })
            .use(routes)
            .listen(this.port, () => console.log(`Server listening on port ${this.port}`));
    }

    start() {
        this.buildApp();
    }
}

module.exports = ServerHttp;
