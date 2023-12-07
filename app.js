const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const ServerHttp = require('./http')
const sendMessageChatWood = require("./services/chatwood")

const flowPrincipal = addKeyword(['']).addAction(
    async (ctx, { flowDynamic }) => {
        try {
            const MESSAGE = "hi, welcome to vivemed";
            await sendMessageChatWood(MESSAGE, 'incoming',ctx);
            await flowDynamic(MESSAGE);
        } catch (e) {
            console.log(`error en app.js: ${e}`)
        }
    }
);


const flowVentas = addKeyword('productos')
    .addAnswer(
        [
            'te comparto los siguientes productos de interes ',
            '👉 articulo 1',
            '👉 articulo 2  ',
            '👉 articulo 3',

        ],
    )
    .addAnswer('🙌 Hola bienvenido a este *Chatbot*')
    .addAnswer(
        [
            'te comparto los siguientes links de interes sobre el proyecto',
            '👉 *doc* para ver la documentación',
            '👉 *gracias*  para ver la lista de videos',
            '👉 *discord* unirte al discord',
        ],
    )

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowPrincipal])
    const adapterProvider = createProvider(BaileysProvider)

    await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
    const server = new ServerHttp(adapterProvider);
    server.start()
}

main()
