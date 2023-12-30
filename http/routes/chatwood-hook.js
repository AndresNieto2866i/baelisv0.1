
const express = require('express')
const router = express.Router()
const chatWoodWook = async (req, res) => {
  const providerWs = req.providerWs;
  const body = req.body;
  try {
    if (isStatusRequest(body)) {
      res.send(null);
      return;
    }

    if (isPrivateMessage(body)) {
      res.send(null);
      return;
    } 

    if (body.content) { 
      console.log(body)
      await sendMessageToUser(providerWs, body);
      res.send(body);
    }
  } catch (error) {
    console.error('Error al enviar el mensaje:', error);
    res.status(500).send('Error al enviar el mensaje');
  }
};

const isStatusRequest = (body) => {
  return body && body.conversation && body.conversation.meta && body.conversation.meta.sender && 
         (body.conversation.meta.sender.phone_number || '').replace('+', '') === 'status';
};

const isPrivateMessage = (body) => {
  return body.private;
};


const sendMessageToUser = async (providerWs, body) => {
  const phone = (body.conversation.meta.sender.phone_number || '').replace('+', '');
  await providerWs.sendMessage(`${phone}@c.us`, { text: body.content });
};

router.post('/chatwood-hook', chatWoodWook)

router.get('/', (req, res) => {
  try {
    console.log('server response')
    res.json({ message: "hola" })
  } catch (e) {
    console.log(e)
  }
})

module.exports = router 