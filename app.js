// const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
// const BaileysProvider = require('@bot-whatsapp/provider/baileys')
// const MockAdapter = require('@bot-whatsapp/database/mock')
// const ServerHttp = require('./http')
// const { sendMessageToChatWood, getOrCreateConversation, getContactInfo, prepareMessage, createContact } = require("./services/chatwood")

// const client = require('./database/database');


// const flowPrincipal = addKeyword(['']).addAction(
//     async (ctx, { flowDynamic }) => {
//         try {
//             const contactInfo = await getContactInfo(ctx.from) || (await createContact(ctx));
//             const account = await getOrCreateConversation(contactInfo.id);
//             let requestBody = {
//                 content: ctx.message.conversation,
//                 message_type: "incoming",
//                 private: true,
//                 content_attributes: {},
//             };
//             console.log(requestBody)
//             await sendMessageToChatWood(account.display_id, requestBody);
//             // const MESSAGE = "hi, welcome to vivemed";
//             // async function obtenerMensajes() {
//             //     const mensajesQuery = await client.query(`
//             //      SELECT * 
//             //      FROM messages 
//             //      WHERE content = '${MESSAGE}' 
//             //      AND account_id = 1 
//             //      AND inbox_id = 5
//             //      AND conversation_id = ${account.id};
//             //  `)
//             //     const mensajes = mensajesQuery.rows;
//             //     return mensajes[0]

//             // }
//             // let { mensajeEnviar, message_type: messageType } = await prepareMessage(MESSAGE, ctx, account);
//             // console.log(mensajeEnviar, messageType);

//             // let mensaje = await obtenerMensajes();
//             // if (!mensaje) {
//             //     await flowDynamic(MESSAGE);
//             //      requestBody = {
//             //         content: mensajeEnviar,
//             //         message_type: messageType,
//             //         private: true,
//             //         content_attributes: {},
//             //     };
//             //     await sendMessageToChatWood(account.display_id, requestBody);
//             //     mensaje = await obtenerMensajes();
//             // }

//             // Reassign values
//             // ({ mensajeEnviar, message_type: messageType } = await prepareMessage(MESSAGE, ctx, account));

//             // const currentDate = new Date()
//             // const horasDiferencia = (currentDate - mensaje.created_at) / (1000 * 60 * 60);

//             // if (horasDiferencia >= 24) {
//             //     await flowDynamic(MESSAGE);
//             // }

//             //  requestBody = {
//             //     content: mensajeEnviar,
//             //     message_type: messageType,
//             //     private: true,
//             //     content_attributes: {},
//             // };
//             // console.log(requestBody)
//             // await sendMessageToChatWood(account.display_id, requestBody);
//         } catch (e) {
//             console.log(`error en app.js: ${e}`)
//         }
//     }
// );

// const main = async () => {
//     const adapterDB = new MockAdapter()
//     const adapterFlow = createFlow([flowPrincipal])
//     const adapterProvider = createProvider(BaileysProvider)

//     await createBot({
//         flow: adapterFlow,
//         provider: adapterProvider,
//         database: adapterDB,
//     })

//     const server = new ServerHttp(adapterProvider);
//     server.start()
// }

// main()

const fs = require('fs')
const ServerHttp = require('./http')
const { sendMessageToChatWood, getOrCreateConversation, getContactInfo, prepareMessage, createContact } = require("./services/chatwood")

const qrcode = require('qrcode');
const {
  DisconnectReason,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const makeWASocket = require("@whiskeysockets/baileys").default;

async function saveQRCode(qrData) {
  try {
      // Generar el código QR como una cadena de datos
      const qrCodeDataUrl = await qrcode.toDataURL(qrData, { errorCorrectionLevel: 'H' });

      // Extraer la parte de datos de la URL
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');

      // Escribir los datos en el archivo qr.png
      fs.writeFileSync('qr.png', base64Data, 'base64');

      console.log('Código QR guardado en qr.png');
  } catch (error) {
      console.error('Error al guardar el código QR:', error);
  }
}
async function connectionLogic() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update || {};

      if (qr) {
          // Guardar el código QR en un archivo llamado qr.png
          await saveQRCode(qr);
      }

      if (connection === "close") {
          const shouldReconnect =
              lastDisconnect?.error?.output?.statusCode !==
              DisconnectReason.loggedOut;

          if (shouldReconnect) {
              connectionLogic();
          }
      }
  });

    sock.ev.on("messages.upsert", (messageInfoUpsert) => {
        console.log("=======");
        console.log("message upsert");
        console.log(JSON.stringify(messageInfoUpsert));
        console.log(messageInfoUpsert.messages.map((m) => {
            console.log(m.message.conversation);
            if (!m.key.fromMe) {

            }
        }));
        console.log("=======");
    });

    sock.ev.on("creds.update", saveCreds);

    // Utilizar sock como providerWs
    const server = new ServerHttp(sock);
    server.start();
}

connectionLogic();
