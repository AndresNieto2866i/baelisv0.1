const fs = require('fs');
const express = require('express');
const WhatsAppConnection = require('./WhatsAppConnection/WhatsAppConnection');
const { json } = require('body-parser');

const port = 20000;
const app = express();
app.use(express.json());

const jsonFilePath = 'carpetas.json';

let conexionesActivas = []
app.get('/', (req, res) => {
    try {
        res.sendFile(__dirname + '/index.html');
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
})

app.get('/run', (req, res) => {
    try {
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'))
        console.log(jsonData)
        jsonData.map(async (carpeta) => {
            const conexion = new WhatsAppConnection(carpeta.carpeta, carpeta.puerto);
            await conexion.start();
            conexionesActivas.push(conexion)
        })

        const servidores = JSON.parse(fs.readFileSync('lista_servidores.json', 'utf-8'));
        const estado = 'abierto'

        res.status(200).json({ message: 'Operación exitosa. El proceso está en ejecución.', servidores, estado })
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
})

app.get('/stop', async (req, res) => {
    try {
        console.log('Deteniendo servidores activos...')
        // Cierra los servidores activos y limpia la lista
        await Promise.all(conexionesActivas.map(m => m.closeServer()))


        // Limpia la lista de servidores en el archivo JSON
        fs.writeFileSync('./lista_servidores.json', '[]', 'utf-8');
        const estado = 'close'

        // Envía una respuesta al cliente
        res.status(200).json({ message: 'Servidores detenidos y lista limpiada exitosamente.', estado })
    } catch (error) {
        console.error('Error al procesar la solicitud de detener los servidores:', error)
        // Manejar el error de manera apropiada, posiblemente enviando un código de estado 500 al cliente.
        res.status(500).json({ error: 'Error interno del servidor al detener los servidores.' });
    }
})

app.get('/files', (req, res) => {
    try {
        const folder = './QRs';

        fs.readFile('./carpetas.json', 'utf8', (err, data) => {
            if (err) {
                console.error('Error al leer el archivo:', err);
                return;
            }

            try {
                const servidores = JSON.parse(data).map((server) => {
                    let clean = server.carpeta;
                    return clean;
                });

                fs.readdir(folder, (err, files) => {
                    let base64images = [];
                    if (err) {
                        console.error(err);
                        return;
                    }

                    files.forEach((file) => {
                        const direccion = `${folder}/${file}`;
                        const data = fs.readFileSync(direccion, { encoding: 'base64' });
                        const nameD = file.split('.')[0];
                        const name = nameD.split('-')[1];

                        // Solo agregar si el valor de name está dentro de la lista de servidores
                        console.log(servidores)
                        if (servidores.includes(name)) {

                            base64images.push({ name, data });
                        }
                    });

                    const total = base64images.length;
                    res.json({ archivos: base64images, total });
                });

            } catch (error) {
                console.error('Error al analizar el JSON:', error);
            }
        })

    } catch (E) {
        console.log('error', E);
    }
});



app.post('/createCarpet', async (req, res) => {
    if (!fs.existsSync(jsonFilePath)) {
        fs.writeFileSync(jsonFilePath, '[]', 'utf-8');
    }
    try {

        const nuevaCarpeta = req.body.carpeta;
        const puerto = req.body.puerto

        let jsonData;
        if (fs.existsSync(jsonFilePath)) {
            jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
        } else {
            jsonData = [];
        }

        const carpetaExistente = jsonData.find(item => item.carpeta === nuevaCarpeta);
        const puertoExiste = jsonData.find(item => item.puerto === puerto)
        if (carpetaExistente || puertoExiste) {
            console.log('existe')
            return res.status(400).json(`La carpeta ${nuevaCarpeta} ya existe.`);
        }

        jsonData.push({ carpeta: nuevaCarpeta, puerto });

        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');

        res.json(`Creada: ${nuevaCarpeta}`);
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).json('Error interno del servidor');
    }
});
app.get('/servers', (req, res) => {
    try {
        fs.readFile(jsonFilePath, 'utf-8', (err, data) => {
            if (err) {
                // Manejar el error, por ejemplo, enviar una respuesta de error al cliente
                console.error(err);
                res.status(500).send('Error interno del servidor');
                return;
            }

            // Enviar los datos leídos como respuesta JSON
            data = JSON.parse(data)
            res.send(data);
        });
    } catch (e) {
        // Manejar errores en la parte sincrónica, si es necesario
        console.error(e);
        res.status(500).send('Error interno del servidor');
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
