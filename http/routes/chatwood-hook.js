const { createReadStream } = require('fs')
const { join } = require('path')
const express = require('express')
const router = express.Router()

const chatWoodWook = async (req, res) => {
  const providerWs = req.providerWs;
  const body = req.body
  if (body.private) {
    res.send(null)
    return
  }
  const phone = (body?.conversation?.meta?.sender?.phone_number || '').replace('+', '');

  try {
    // Asegúrate de que el método sendMessage sea asincrónico
    if (body.content) {

      await providerWs.sendMessage(`${phone}@c.us`, { text: body.content });
      res.send(body);
    }
  } catch (error) {
    console.error('Error al enviar el mensaje:', error);
    res.status(500).send('Error al enviar el mensaje');
  }
}
router.post('/chatwood-hook', chatWoodWook)
router.get("/get-qr", async (_, res) => {
  const YOUR_PATH_QR = join(process.cwd(), `qr.png`);
  const fileStream = createReadStream(YOUR_PATH_QR);
  console.log(YOUR_PATH_QR)

  res.writeHead(200, { "Content-Type": "image/png" });
  fileStream.pipe(res);
});

module.exports = router 