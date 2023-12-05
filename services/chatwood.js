const API_CHATWOOD = "https://cwchat.full-sms.uno/"
const sendMessageChatWood = async (msg = "", message_type = "") => {
try{
      var myHeaders = new Headers();
    myHeaders.append("api_access_token", "HEGMKYyavrE2Zm23Z8PHgPxi");
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
        content: msg,
        message_type: message_type,
        private: true,
        content_type: "input_email",
        content_attributes: {},
    });

    var requestOption = {
        method: "POST",
        headers: myHeaders,
        body: raw,  
    };

    const dataRaw = await fetch(
        `${API_CHATWOOD}api/v1/accounts/1/conversations/26/messages`,
        requestOption
    );

    if (!dataRaw.ok) {
        dataRaw.url
        throw new Error(`${dataRaw.statusText}`);
    }

    const data = await dataRaw.json();
    return data;
} catch (error) {
    console.error('Error durante la solicitud:', error.message);
    // Puedes decidir qu� hacer en caso de error, por ejemplo, lanzar una excepci�n, retornar un valor predeterminado o realizar alguna otra acci�n de manejo de errores.
}

}

module.exports = sendMessageChatWood
