const fs = require('fs');
const qrcode = require('qrcode');
const makeWASocket = require("@whiskeysockets/baileys").default;
const ServerHttp = require('../http');
const { DisconnectReason, useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const { sendMessageToChatWood, getOrCreateConversation, getContactInfo, createContact } = require("../services/chatwood");
const { json } = require('stream/consumers');

module.exports = class WhatsAppConnection {
    constructor(carpeta, puerto) {
        this.sock = null;
        this.carpeta = carpeta;
        this.server = null; // Almacena la instancia del servidor
        this.puerto = puerto
    }
    async saveQRCode(qrData) {
        try {
            const qrCodeDataUrl = await qrcode.toDataURL(qrData, { errorCorrectionLevel: 'H' });
            const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
            if (!fs.existsSync('./QRs')) {
                fs.mkdirSync('./QRs');
                console.log('Carpeta QRs creada.');
            }
            fs.writeFileSync(`./QRs/qr-${this.carpeta}.png`, base64Data, 'base64');
            console.log(`Código QR guardado en ./QRs/qr-${this.carpeta}.png`);
        } catch (error) {
            console.error('Error al guardar el código QR:', error);
        }
    }



    async start() {
        if (!fs.existsSync('./sesiones')) {
            fs.mkdirSync('./sesiones');
            console.log('Carpeta sesiones creada.');
        }
        const { state, saveCreds } = await useMultiFileAuthState(`./sesiones/${this.carpeta}`);
        this.sock = makeWASocket({
            printQRInTerminal: false,
            auth: state,
        });

        this.sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update || {};

            if (qr) {
                await this.saveQRCode(qr);
            }

            if (connection === "close") {
                const shouldReconnect =
                    lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

                if (shouldReconnect) {
                    this.start();
                }
            }
        });

        this.sock.ev.on("messages.upsert", async (messageInfoUpsert) => {
            try {
                await Promise.all(messageInfoUpsert.messages.map(async (m) => {
                    if (!m.key.fromMe) {
                        const telefonoEnvia = m.key.remoteJid.split('@')[0]
                        const pushName = m.pushName
                        const contactInfo = await getContactInfo(telefonoEnvia) || (await createContact(pushName, telefonoEnvia));
                        const account = await getOrCreateConversation(contactInfo.id, this.carpeta)
                        // console.log(account)

                        let mensaje = ''
                        if (m.message.extendedTextMessage && m.message.extendedTextMessage.text) {
                            mensaje = m.message.extendedTextMessage.text;

                        } else if (m.message.conversation) {
                            console.log('Es una conversación');
                            mensaje = m.message.conversation
                        } else if (m.message.extendedTextMessage) {
                            
                        } else if (m.message.audioMessage) {
                            mensaje = 'es un audio, no es posible transcribir'
                        } else {
                        }

                        let requestBody = {
                            content: mensaje || 'mensaje no disponible',
                            message_type: "incoming",
                            private: true,
                            content_attributes: {},
                        };

                        await sendMessageToChatWood(account.display_id, requestBody, this.puerto);
                    } else {
                        const telefonoEnvia = m.key.remoteJid.split('@')[0]

                        const contactInfo = await getContactInfo(telefonoEnvia) || (await createContact(pushName, telefonoEnvia));
                        const account = await getOrCreateConversation(contactInfo.id, this.carpeta)
                        let mensaje = ''
                        if (m.message.extendedTextMessage && m.message.extendedTextMessage.text) {
                            mensaje = m.message.extendedTextMessage.text;

                        } else if (m.message.conversation) {
                            console.log('Es una conversación');
                            mensaje = m.message.conversation
                        } else if (m.message.extendedTextMessage) {

                        } else if (m.message.audioMessage) {
                            mensaje = 'es un audio, no es posible transcribir'
                        } else {
                        }
                        let requestBody = {
                            content: mensaje,
                            message_type: "outgoing",
                            private: true,
                            content_attributes: {}
                        }
                        await sendMessageToChatWood(account.display_id, requestBody, this.puerto);


                    }
                }));
            } catch (error) {
                console.log(messageInfoUpsert.messages[0])
                console.error("Error:", error);
                // Puedes manejar el error de la manera que desees, por ejemplo, registrándolo, enviando una respuesta específica, etc.
            }
        });

        this.sock.ev.on("creds.update", saveCreds);

        const server = new ServerHttp(this.sock, this.carpeta, this.puerto);
        this.server = server;
        await server.start();
    }
    async closeServer() {
        try {
            if (this.server && this.server.app) {
                console.log('Cerrando el servidor...');
                await this.server.closeServer();
                console.log('Servidor cerrado exitosamente.');
            } else {
                console.warn('El servidor no está inicializado o ya está cerrado.');
            }
        } catch (error) {
            console.error('Error al cerrar el servidor:', error);
        }
    }
}
