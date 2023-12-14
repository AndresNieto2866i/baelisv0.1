const client = require('../database/database');
const { API_CHATWOOD, headers } = require('../constantes');

const getContactInfo = async (phoneNumber) => {
    const contactQuery = {
        text: 'SELECT * FROM contacts WHERE phone_number = $1',
        values: [`+${phoneNumber}`],
    };

    const contactResult = await client.query(contactQuery);
    return contactResult.rows.length > 0 ? contactResult.rows[0] : null;
};

const createContact = async (ctx) => {
    const insertQuery = {
        text: 'INSERT INTO contacts(name, phone_number, account_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
        values: [`${ctx.pushName}`, `+${ctx.from}`, 1],
    };

    const result = await client.query(insertQuery);
    const contactInfo = await getContactInfo(ctx.from);
    return contactInfo;
};
const prepareMessage = async (msg, ctx, conversation_id) => {
    let mensajeEnviar = '';
    let message_type = '';

    try {
        mensajeEnviar = ctx.message.conversation
        message_type = 'incoming'
        return { mensajeEnviar, message_type };
    } catch (error) {
        console.error('Error en prepareMessage:', error);
        throw error; // Puedes manejar el error según tus necesidades
    }
};


const getOrCreateConversation = async (contactId) => {
    const conversationQuery = {
        text: 'SELECT * FROM conversations WHERE contact_id = $1 LIMIT 1',
        values: [contactId],
    };

    const conversationResult = await client.query(conversationQuery);
    const conversation = conversationResult.rows.length > 0 ? conversationResult.rows[0] : null;
    if (!conversation) {
        const createConversationBody = {
            inbox_id: '5', // Adjust as needed
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

        return await getOrCreateConversation(contactId);
    }

    return conversation;
};

const sendMessageToChatWood = async (conversationId, requestBody) => {
    console.log('enviando mensaje')
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


const sendMessageChatWood = async (msg = '', ctx) => {
    try {
        const contactInfo = await getContactInfo(ctx.from) || (await createContact(ctx));
        const conversation = await getOrCreateConversation(contactInfo.id);
        const { mensajeEnviar, message_type: messageType } = await prepareMessage(msg, ctx, conversation);

        const requestBody = {
            content: mensajeEnviar,
            message_type: messageType,
            private: true,
            content_attributes: {},
        };
        await sendMessageToChatWood(conversation.display_id, requestBody);
        return conversation
    } catch (error) {
        console.error('Error during the request:', error.message);
        // Handle errors as needed.
    }
};

module.exports = { sendMessageToChatWood, getOrCreateConversation, getContactInfo, prepareMessage, createContact };
