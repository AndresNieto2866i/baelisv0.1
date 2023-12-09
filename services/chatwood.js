const client = require('../database/database');
const {API_CHATWOOD, headers} =require('../constantes')

const sendMessageChatWood = async (msg = "", message_type = "", ctx) => {
    console.log(ctx.message.conversation)
    try {
        // Consultar la base de datos para obtener información del contacto
        const contactQuery = {
            text: 'SELECT * FROM contacts WHERE phone_number = $1',
            values: [`+${ctx.from}`]    
        };
        let contactResult = await client.query(contactQuery);
        let contacto = contactResult.rows.length > 0 ? contactResult.rows[0] : null;
        if (!contacto) {
            let insertQuery = { 
                text: 'INSERT INTO contacts(name, phone_number, account_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
                values: [`${ctx.pushName}`, `+${ctx.from}`, 1],
            };
            const result = await client.query(insertQuery);
            console.log('Se insertó correctamente:', result);
            contactResult = await client.query(contactQuery);
            contacto = contactResult.rows.length > 0 ? contactResult.rows[0] : null;
        } else {
            console.log(contacto)
        }

        console.log('Información encontrada para el número de teléfono:', ctx.from);

        // Preparar el cuerpo de la solicitud para enviar a ChatWood
        let requestBody = {
            content: ctx.message.conversation,
            message_type: message_type,
            private: true,
            content_attributes: {},
        };

        // Configurar las opciones de la solicitud HTTP
        const requestOptions = {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody),
        };


        // Consultar la base de datos para obtener información de la conversación
        const conversationQuery = {
            text: "SELECT * FROM conversations WHERE contact_id = $1 LIMIT 1",

            values: [contacto.id]
        };

        let conversationResult = await client.query(conversationQuery);
        let conversation = conversationResult.rows.length > 0 ? conversationResult.rows[0] : null;

        if (!conversation) {
            let createConversationBody = {
                inbox_id: "5", // Ajusta según tu necesidad
                contact_id: contacto.id,
                status: "open",
            };

            // Configurar las opciones de la solicitud HTTP para crear la conversación
            const createConversationRequestOptions = {
                method: "POST",
                headers,
                body: JSON.stringify(createConversationBody),
            };

            // Hacer la solicitud para crear una nueva conversación
            const createConversationUrl = `${API_CHATWOOD}api/v1/accounts/1/conversations`;
            const createConversationDataRaw = await fetch(createConversationUrl, createConversationRequestOptions);

            if (!createConversationDataRaw.ok) {
                throw new Error(`${createConversationDataRaw.statusText}`);
            }

            const createConversationData = await createConversationDataRaw.json();
            

            // Utilizar la información de la conversación creada

            conversationResult = await client.query(conversationQuery);
            conversation = conversationResult.rows.length > 0 ? conversationResult.rows[0] : null
        }

        // Enviar el mensaje a ChatWood
        const apiUrl = `${API_CHATWOOD}api/v1/accounts/1/conversations/${conversation.display_id}/messages`;
        console.log(apiUrl)
        const dataRaw = await fetch(apiUrl, requestOptions);

        if (!dataRaw.ok) {
            const todasC = await client.query({ text: 'select * from conversations' })
            console.log(todasC.rows)
            throw new Error(`${dataRaw.statusText}`);
        }

        const data = await dataRaw.json();
        console.log('Respuesta de ChatWood:', JSON.stringify(data));

        return data;

    } catch (error) {
        console.error('Error durante la solicitud:', error.message);
        // Puedes decidir qué hacer en caso de error, como lanzar una excepción, retornar un valor predeterminado o realizar alguna otra acción de manejo de errores.
    }
};
module.exports = sendMessageChatWood
