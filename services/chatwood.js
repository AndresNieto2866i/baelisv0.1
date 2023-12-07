const client = require('../database/database');
const API_CHATWOOD = "https://cwchat.full-sms.uno/";

const sendMessageChatWood = async (msg = "", message_type = "", ctx) => {
    console.log(ctx)
    try {
        // Consultar la base de datos para obtener información del contacto
        const contactQuery = {
            text: 'SELECT * FROM contacts WHERE phone_number = $1',
            values: [`+${ctx.from}`]
        };
        const contactResult = await client.query(contactQuery);
        const contacto = contactResult.rows.length > 0 ? contactResult.rows[0] : null;
        if (!contacto) {
            const insertQuery = {
                text: 'INSERT INTO contacts(name, phone_number, account_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
                values: [`+${ctx.from}`, `+${ctx.from}`, 1],
            };
            const result = await client.query(insertQuery);
            console.log('Se insertó correctamente:', result);
        } else {
            console.log(contacto)
        }

        console.log('Información encontrada para el número de teléfono:', ctx.from);

        // Preparar el cuerpo de la solicitud para enviar a ChatWood
        const requestBody = {
            content: msg,
            message_type: message_type,
            private: true,
            content_type: "input_email",
            content_attributes: {},
        };

        // Configurar las opciones de la solicitud HTTP
        const requestOptions = {
            method: "POST",
            headers: {
                "api_access_token": "HEGMKYyavrE2Zm23Z8PHgPxi",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody),
        };

        console.log('Enviando mensaje a ChatWood');

        // Consultar la base de datos para obtener información de la conversación
        const conversationQuery = {
            text: "SELECT * FROM conversations WHERE contact_id = $1 LIMIT 1",
            values: [contacto.id]
        };
        // const conversationResult = await client.query(conversationQuery);
        // const conversation = conversationResult.rows.length > 0 ? conversationResult.rows[0] : null;

        // if (!conversation) {
        //     console.log('No se encontró ninguna conversación para el contacto:', contacto.id);
        //     return; // Salir si no se encuentra información de la conversación
        // }

        // // Enviar el mensaje a ChatWood
        // const apiUrl = `${API_CHATWOOD}api/v1/accounts/1/conversations/${conversation.id}/messages`;
        // const dataRaw = await fetch(apiUrl, requestOptions);

        // if (!dataRaw.ok) {
        //     throw new Error(`${dataRaw.statusText}`);
        // }

        // const data = await dataRaw.json();
        // console.log('Respuesta de ChatWood:', JSON.stringify(data));

        return data;

    } catch (error) {
        console.error('Error durante la solicitud:', error.message);
        // Puedes decidir qué hacer en caso de error, como lanzar una excepción, retornar un valor predeterminado o realizar alguna otra acción de manejo de errores.
    }
};
module.exports = sendMessageChatWood
