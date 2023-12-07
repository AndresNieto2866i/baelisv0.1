const { Client } = require('pg');

// Configuraci�n de la conexi�n
 const client = new Client({
  user: 'chatwoot',
  host: 'localhost',
  database: 'chatwoot_production',
  password: 'a1s13R85M086Tx2', // Incluye la contrase�a si es necesaria
  port: 5432, // Puerto predeterminado para PostgreSQL
});

// Conectar a la base de datos y realizar una consulta de prueba
client.connect()
  .then(() => {
    console.log('Conexi�n exitosa a la base de datos');

    // Consulta para obtener la versi�n del servidor PostgreSQL
    return client.query('SELECT version()');
  })
  .then((result) => {
    console.log('Versi�n del servidor PostgreSQL:', result.rows[0].version);
  })
  .catch((err) => {
    console.error('Error al conectar a la base de datos', err);
  })
  module.exports = client
