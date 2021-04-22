const envFile = require('dotenv').config();
const data = "{\"limit\": 1000}";

class Services {

    constructor(app) {
        this.https = app.https;
        this.fs = app.fs;
    }

    doRequest = async(url,options) =>{
        return new Promise((resolve, reject) => {
            const req = this.https.request(url,options, (res) => {
                console.log(`${new Date()} File Uploaded with status code ${res.statusCode}`);

                res.setEncoding('utf8');
                let responseBody = '';

                res.on('data', (chunk) => {
                    responseBody += chunk;
                });

                res.on('end', () => {
                    resolve(JSON.parse(responseBody));
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            req.write(data);
            req.end();
        });
    };

    uploadFile = async (req) => {

        let self =this;

        let pathname = './uploads/'+ req.file.originalname;

        let data = this.fs.readFileAsync(pathname, 'base64');

        const url = 'https://content.dropboxapi.com/2/files/upload';
        const options = {
            method: 'POST',
            headers: {
                'Authorization': process.env.token,
                'Dropbox-API-Arg': JSON.stringify({
                    'path': '/Uploads/'+req.file.originalname,
                    'mode': 'add',
                    'autorename': true,
                    'mute': false,
                    'strict_conflict': false
                }),
                'Content-Type': 'application/octet-stream',
            }
        };
        return await self.doRequest(url,options);

    }
}

module.exports = Services;
