const { createReadStream } = require('fs')
const { join } = require('path')
const express = require('express')
const router = express.Router()

const chatWoodWook = async (req, res) => {
  const providerWs = req.providerWs;
  const body = req.body
  console.log(body)
  if (body.private) {
    res.send(null)
    return
  }
  const phone = body?.conversation?.meta?.sender?.phone_number.replace('+', '')
  console.log(phone)
  await providerWs.sendText(`${phone}@c.us`, body.content)
  res.send(body)
}
router.post('/chatwood-hook', chatWoodWook)
router.get("/get-qr", async (_, res) => {
  const YOUR_PATH_QR = join(process.cwd(), `bot.qr.png`);
  const fileStream = createReadStream(YOUR_PATH_QR);

  res.writeHead(200, { "Content-Type": "image/png" });
  fileStream.pipe(res);
});

module.exports = router 