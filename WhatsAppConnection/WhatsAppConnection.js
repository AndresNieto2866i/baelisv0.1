const fs = require('fs');
const qrcode = require('qrcode');
const makeWASocket = require("@whiskeysockets/baileys").default;
const ServerHttp = require('../http');
const {
    DisconnectReason,
    useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const { sendMessageToChatWood, getOrCreateConversation, getContactInfo, prepareMessage, createContact } = require("../services/chatwood")

module.exports = class WhatsAppConnection {
    constructor(carpeta) {
        this.sock = null;
        this.carpeta = carpeta
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
            console.log('Código QR guardado en qr.png');
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
            console.log("=======");
            console.log(JSON.stringify(messageInfoUpsert));
            (messageInfoUpsert.messages.map(async (m) => {
                console.log(m.message.conversation);
                if (!m.key.fromMe) {
                    const telefonoEnvia = m.key.remoteJid.split('@')[0]
                    const pushName = m.pushName
                    const contactInfo = await getContactInfo(telefonoEnvia) || (await createContact(pushName, telefonoEnvia));
                    const account = await getOrCreateConversation(contactInfo.id);
                    let requestBody = {
                        content: m.message.conversation,
                        message_type: "incoming",
                        private: true,
                        content_attributes: {},
                    };
                    await sendMessageToChatWood(account.display_id, requestBody);


                }
            }));
            console.log("=======");
        });

        this.sock.ev.on("creds.update", saveCreds);

        const server = new ServerHttp(this.sock, this.carpeta);
        server.start();
    }
}