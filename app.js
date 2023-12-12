const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const ServerHttp = require('./http')
const { sendMessageToChatWood, getOrCreateConversation, getContactInfo, prepareMessage, createContact } = require("./services/chatwood")

const client = require('./database/database');


const flowPrincipal = addKeyword(['']).addAction(
    async (ctx, { flowDynamic }) => {
        try {
            const contactInfo = await getContactInfo(ctx.from) || (await createContact(ctx));
            const account = await getOrCreateConversation(contactInfo.id);
            let requestBody = {
                content: ctx.message.content,
                message_type: "incoming",
                private: true,
                content_attributes: {},
            };
            await sendMessageToChatWood(account.display_id, requestBody);
            const MESSAGE = "hi, welcome to vivemed";
            async function obtenerMensajes() {
                const mensajesQuery = await client.query(`
                 SELECT * 
                 FROM messages 
                 WHERE content = '${MESSAGE}' 
                 AND account_id = 1 
                 AND inbox_id = 5
                 AND conversation_id = ${account.id};
             `)
                const mensajes = mensajesQuery.rows;
                return mensajes[0]

            }
            let { mensajeEnviar, message_type: messageType } = await prepareMessage(MESSAGE, ctx, account);
            console.log(mensajeEnviar, messageType);

            let mensaje = await obtenerMensajes();
            if (!mensaje) {
                await flowDynamic(MESSAGE);
                 requestBody = {
                    content: mensajeEnviar,
                    message_type: messageType,
                    private: true,
                    content_attributes: {},
                };
                await sendMessageToChatWood(account.display_id, requestBody);
                mensaje = await obtenerMensajes();
            }

            // Reassign values
            ({ mensajeEnviar, message_type: messageType } = await prepareMessage(MESSAGE, ctx, account));
            
            const currentDate = new Date()
            const horasDiferencia = (currentDate - mensaje.created_at) / (1000 * 60 * 60);

            if (horasDiferencia >= 24) {
                await flowDynamic(MESSAGE);
            }

             requestBody = {
                content: mensajeEnviar,
                message_type: messageType,
                private: true,
                content_attributes: {},
            };
            console.log(requestBody)
            await sendMessageToChatWood(account.display_id, requestBody);
        } catch (e) {
            console.log(`error en app.js: ${e}`)
        }
    }
);

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowPrincipal])
    const adapterProvider = createProvider(BaileysProvider)

    await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    const server = new ServerHttp(adapterProvider);
    server.start()
}

main()
