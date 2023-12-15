const fs = require('fs');
const express = require('express');
const WhatsAppConnection = require('./WhatsAppConnection/WhatsAppConnection')

const port = 20000;
const app = express();
app.use(express.json());

const jsonFilePath = 'carpetas.json';

// Verificar si el archivo JSON existe, si no existe, inicializarlo con un array vacío
if (!fs.existsSync(jsonFilePath)) {
    fs.writeFileSync(jsonFilePath, '[]', 'utf-8');
}

app.post('/createCarpet', async (req, res) => {
    try {
        const carpeta = req.body.carpeta;

        // Leer el contenido actual del archivo JSON
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

        // Añadir la nueva carpeta al array
        jsonData.push({ carpeta });

        // Escribir el nuevo contenido en el archivo JSON
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');

        res.json(`Creada: ${carpeta}`);
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).json('Error interno del servidor');
    }
});
app.get('/run', (req, res) => {
    try {
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
        console.log(jsonData);

        jsonData.forEach((carpeta) => {
            console.log(carpeta.carpeta);
            const conexion = new WhatsAppConnection(carpeta.carpeta);
            conexion.start();
        });

        // Agregar un mensaje de éxito en la respuesta al cliente
        const lista = JSON.parse(fs.readFileSync('lista_servidores.json', 'utf-8'));
        res.status(200).json({ message: 'Operación exitosa. El proceso está en ejecución.', servidores:lista });

    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        // Manejar el error de manera apropiada, posiblemente enviando un código de estado 500 al cliente.
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
