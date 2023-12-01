const express = require('express')
const routes = require('./routes/chatwood-hook')


class ServerHttp {
    port = 30003
    app;
    providerWs;
    constructor(providerWs) {
    this.providerWs = providerWs
        
    }
    buildApp = () => {
        this.app = express()
        .use(express.json())
        .use((req, _, next) => {
        req.providerWs = this.providerWs
        next()
        })
        .use(routes)
        .listen(this.port, () =>console.log(`http://localhost:${this.port}`))
    }
    start(){
        this.buildApp()
    }
}

module.exports = ServerHttp