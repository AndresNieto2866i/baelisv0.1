
const express = require('express')
const router = express.Router()

const chatWoodWook = async (req, res) => {
  const providerWs = req.providerWs;
  const body = req.body
  if (body.private) {
    res.send(null)
    return
  };

  try {
    if (body && body.conversation && body.conversation.meta && body.conversation.meta.sender) {
      const phone = (body.conversation.meta.sender.phone_number || '').replace('+', '');

      if (body.content) {
        console.log(phone, body.content);
        await providerWs.sendMessage(`${phone}@c.us`, { text: body.content });
        console.log('visitando');
        res.send(body);
      }
    } else {
      console.error('Error al enviar el mensaje: Estructura de objeto no válida');
      res.status(400).send('Estructura de objeto no válida');
    }
  } catch (error) {
    console.error('Error al enviar el mensaje:', error);
    console.log(JSON.stringify(providerWs))
    res.status(500).send('Error al enviar el mensaje');
  }
}
router.post('/chatwood-hook', chatWoodWook)

router.get('/',(req, res)=>{
  try{
    console.log('server response')
  res.json({message:"hola"})
  }catch(e){
    console.log(e)
  }
})

module.exports = router 