
import { readdir } from 'fs';
const folder = './QRs';
readdir(folder, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }

    const qrDiv = document.getElementById('qrlist');
    qrDiv.innerText = 'Archivos: ' + files.join(', ');
});