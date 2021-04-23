const envFile = require('dotenv').config();
const data = "{\"limit\": 1000}";

class Services {

    constructor(app) {
        this.https = app.https;
        this.fs = app.fs;
        this.path = app.path;
    }

    uploadFile = async (req,res) => {

        let self = this;

        let pathname = './uploads/' + req.file.originalname;

        let data = this.fs.readFileAsync(pathname, 'base64');

        const url = 'https://content.dropboxapi.com/2/files/upload';
        const options = {
            method: 'POST',
            headers: {
                'Authorization': process.env.token,
                'Dropbox-API-Arg': JSON.stringify({
                    'path': '/Uploads/' + req.file.originalname,
                    'mode': 'add',
                    'autorename': true,
                    'mute': false,
                    'strict_conflict': false
                }),
                'Content-Type': 'application/octet-stream',
            }
        };
        let response =  await self.doUploadRequest(url, options);
        if(response.id){
            console.log(`${new Date()} File ${response.name} of size ${response.size} Uploaded Successfully with Id ${response.id} `)
            res.redirect('/successUpload');
        }
        else{
            console.log(`${new Date()} Error while Uploading File`);
            res.redirect('/failure');
        }
    }

    doUploadRequest = async (url, options) => {

        return new Promise((resolve, reject) => {

            try {
                const req = this.https.request(url, options, (res) => {
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
            } catch (e) {
                console.log(`${new Date()} Catch at File Uploading ${JSON.stringify(e)}`);
            }
        });
    };


    downloadFile = async (req,res) => {

        let self = this;
        let pathname = req.body.fileName;
        console.log(`${new Date()} Downloading File ${pathname}`);

        const url = 'https://content.dropboxapi.com/2/files/download';
        const options = {
            method: 'POST',
            headers: {
                'Authorization': process.env.token,
                'Dropbox-API-Arg' : JSON.stringify({"path":'/Uploads/'+pathname})
            }
        };
        let response =  await self.doDownloadRequest(url, options, pathname);
        if(response){
            res.redirect('/successDownload');
        }
        else{
            console.log(`${new Date()} Error while Downloading File`);
            res.redirect('/failure');
        }
    };

    doDownloadRequest = async (url, options, fileName) => {

        return new Promise((resolve, reject) => {

            try {
                const req = this.https.request(url, options, (res) => {
                    console.log(`${new Date()} File Downloaded with status code ${res.statusCode}`);

                    res.setEncoding('base64');
                    let responseBody = '';

                    res.on('data', (chunk) => {
                        responseBody += chunk;
                    });

                    res.on('end', () => {
                        let storagePath = this.path.join(__dirname, '../downloads',fileName);
                        console.log(`${new Date()} Storing File at ${storagePath}`);
                        let a = this.fs.writeFileAsync(storagePath, responseBody,'base64');
                        a.then((result)=>{
                            resolve(responseBody);
                        })
                    });
                });

                req.on('error', (err) => {
                    reject(err);
                });

                req.end();
            } catch (e) {
                console.log(`${new Date()} Catch at File Uploading ${JSON.stringify(e)}`);
            }
        });
    };

}

module.exports = Services;
