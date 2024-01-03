const client = require('../database/database');
const { API_CHATWOOD, headers } = require('../constantes');

const getInbox = async (name) => {
    try {
        let url = `${API_CHATWOOD}api/v1/accounts/1/inboxes`;
        const inboxesResponse = await fetch(url, {
            method: 'GET',
            headers: headers,
        });

        if (!inboxesResponse.ok) {
            throw new Error(`Error fetching inboxes: ${inboxesResponse.statusText}`);
        }

        const inboxesData = await inboxesResponse.json();
        // Filtrar los inboxes basados en el nombre
        const filteredInbox = inboxesData.payload.find((inbox) => {
            return inbox.name === name;
        });

        if (filteredInbox) {
            return filteredInbox;
        } else {
            console.log("Ningún inbox encontrado para el nombre:", name);
        }
    } catch (error) {
        console.error("Error en getInbox:", error.message);
    }
};


const getContactInfo = async (phoneNumber) => {
    const contactQuery = {
        text: 'SELECT * FROM contacts WHERE phone_number = $1',
        values: [`+${phoneNumber}`],
    };

    const contactResult = await client.query(contactQuery);
    return contactResult.rows.length > 0 ? contactResult.rows[0] : null;
};

const createContact = async (pushName, from) => {
    const insertQuery = {
        text: 'INSERT INTO contacts(name, phone_number, account_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
        values: [`${pushName}`, `+${from}`, 1],
    };

    await client.query(insertQuery);
    const contactInfo = await getContactInfo(from);
    return contactInfo;
};
const prepareMessage = async (text) => {
    let mensajeEnviar = '';
    let message_type = '';

    try {
        mensajeEnviar = text
        message_type = 'incoming'
        return { mensajeEnviar, message_type };
    } catch (error) {
        console.error('Error en prepareMessage:', error);
        throw error; // Puedes manejar el error según tus necesidades
    }
};

const getOrCreateConversation = async (contactId, puerto) => {
    const inbox_id = await getInbox(puerto)
    const conversationQuery = {
        text: 'SELECT * FROM conversations WHERE contact_id = $1 LIMIT 1',
        values: [contactId],
    };

    const conversationResult = await client.query(conversationQuery);
    conversation = conversationResult.rows.length > 0 ? conversationResult.rows[0] : null;
    if (!conversation) {
        console.log('no se encontró')
        const createConversationBody = {
            inbox_id: inbox_id.channel_id,
            contact_id: contactId,
            status: 'open',
        };

        const createConversationRequestOptions = {
            method: 'POST',
            headers,
            body: JSON.stringify(createConversationBody),
        };
        const createConversationUrl = `${API_CHATWOOD}api/v1/accounts/1/conversations`;
        const createConversationDataRaw = await fetch(createConversationUrl, createConversationRequestOptions);
        if (!createConversationDataRaw.ok) {
            throw new Error(`${createConversationDataRaw.statusText}`);
        }
        conversation = await getOrCreateConversation(contactId, puerto);
        return conversation
    } else {

        return conversation;
    }

};

const sendMessageToChatWood = async (conversationId, requestBody) => {
    const apiUrl = `${API_CHATWOOD}api/v1/accounts/1/conversations/${conversationId}/messages`;
    const requestOptions = {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
    };

    try {
        const dataRaw = await fetch(apiUrl, requestOptions);
        if (!dataRaw.ok) {
            const todasC = await client.query({ text: 'select * from conversations' });
            throw new Error(`${dataRaw.statusText}`);
        }

        return await dataRaw.json();
    } catch (error) {
        // Aquí manejas el error de la manera que desees
        console.error('Error en sendMessageToChatWood:', error.message);
        throw error; // Puedes volver a lanzar el error si es necesario
    }
};
const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};
const getMessage = async (content, { account_id, inbox_id, conversation_id }) => {
    const currentDateTime = formatDateTime(new Date());
    const fiveMinutesAgo = formatDateTime(new Date(new Date() - 5 * 60 * 1000));

    let consulta = `
        SELECT * FROM messages 
        WHERE content = $1
        AND account_id = $2
        AND inbox_id = $3
        AND conversation_id = $4
        AND created_at BETWEEN $5 AND $6
    `;
    try {
        const data = await client.query(consulta, [content, account_id, inbox_id, conversation_id, fiveMinutesAgo, currentDateTime]);

        if (data.rows.length > 0) {
            console.log("Hay resultados en los últimos cinco minutos.");
        } else {
            console.log("No hay resultados en los últimos cinco minutos.");
        }
    } catch (error) {
        console.error("Error al ejecutar la consulta:", error);
    }
};




module.exports = { sendMessageToChatWood, getOrCreateConversation, getContactInfo, prepareMessage, createContact, getMessage };
