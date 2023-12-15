const fs = require('fs')

const express = require('express');
const routes = require('./routes/chatwood-hook');
const isPortTaken = require('is-port-taken');

class ServerHttp {
    port = 30000;
    app;
    providerWs;

    constructor(providerWs, carpeta) {
        this.providerWs = providerWs;
        this.carpeta = carpeta
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

            const carpeta = this.carpeta; // Reemplaza 'nombre' con el valor real de la carpeta
            const url = `http://localhost:${this.port}`;
    
            const newItem = { carpeta, url };
            const jsonFilePath = 'lista_servidores.json'; // Puedes cambiar el nombre del archivo según tus necesidades
    
            // Lee la lista existente del archivo, o crea una lista vacía si el archivo no existe
            let listaServidores = [];
            try {
                const data = fs.readFileSync(jsonFilePath);
                listaServidores = JSON.parse(data);
    
                // Busca si ya existe una entrada con la misma carpeta
                const existingItemIndex = listaServidores.findIndex(item => item.carpeta === carpeta);
    
                if (existingItemIndex !== -1) {
                    // Si existe, actualiza la URL en lugar de agregar un nuevo objeto
                    listaServidores[existingItemIndex].url = url;
                    console.log(`Se ha actualizado la URL para la carpeta ${carpeta}.`);
                } else {
                    // Si no existe, agrega el nuevo objeto a la lista
                    listaServidores.push(newItem);
                    console.log(`Se ha agregado un nuevo objeto al archivo JSON para la carpeta ${carpeta}.`);
                }
            } catch (error) {
                console.error(`Error al leer o procesar el archivo JSON: ${error.message}`);
            }
    
            // Escribe la lista actualizada de nuevo al archivo
            try {
                const jsonData = JSON.stringify(listaServidores, null, 2);
                fs.writeFileSync(jsonFilePath, jsonData);
                console.log(`Se ha actualizado el archivo JSON con la información actualizada.`);
            } catch (error) {
                console.error(`Error al escribir en el archivo JSON: ${error.message}`);
            }
    }

    start() {
        this.buildApp();
    }
}

module.exports = ServerHttp;
