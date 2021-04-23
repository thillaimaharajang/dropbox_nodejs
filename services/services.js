const envFile = require('dotenv').config();

class Services {

    constructor(app) {
        this.https = app.https;
        this.fs = app.fs;
        this.path = app.path;
    }


    uploadFile = async (req, res) => {

        console.log(`${new Date()} Request to Upload: ${JSON.stringify(req.body)}`);

        let self = this;

        let pathname = './uploads/' + req.file.originalname;

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
                'Content-Type': 'application/octet-stream'
            }
        };

        let response = await self.doUploadRequest(url, options, pathname);

        if (response.id) {
            console.log(`${new Date()} File ${response.name} of size ${response.size} Uploaded Successfully with Id ${response.id} `)
            res.redirect('/successUpload');
        } else {
            console.log(`${new Date()} Error while Uploading File`);
            res.redirect('/failure');
        }

    };


    doUploadRequest = async (url, options, uploadDataPath) => {

        console.log(`${new Date()} Uploading Data from Path ${uploadDataPath}`);

        return new Promise(async (resolve, reject) => {

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


                let chunks = this.fs.createReadStream(uploadDataPath);

                chunks.on('data', function (datachunk) {
                    console.log(new Date() + " Data Chunk Recieved");
                    req.write(datachunk);
                });

                chunks.on('end', function () {
                    req.end();
                })

            } catch (e) {

                console.log(`${new Date()} Catch at File Uploading ${JSON.stringify(e)}`);
                reject('Error while uploading');
            }
        });
    };


    downloadFile = async (req, res) => {

        console.log(`\n${new Date()} Request to Download: ${JSON.stringify(req.body)}`);

        let self = this;
        let pathname = req.body.fileName;
        console.log(`${new Date()} Downloading File ${pathname}`);

        const url = 'https://content.dropboxapi.com/2/files/download';

        const options = {
            method: 'POST',
            headers: {
                'Authorization': process.env.token,
                'Dropbox-API-Arg': JSON.stringify({"path": '/Uploads/' + pathname})
            }
        };

        try {
            let response = await self.doDownloadRequest(url, options, pathname);
            if (response) {
                res.redirect('/successDownload');
            } else {
                console.log(`${new Date()} Error while Downloading File`);
                res.redirect('/failure');
            }
        } catch (e) {
            console.log(`${new Date()} Error while Downloading File ${JSON.stringify(e)}`);
            res.redirect('/failure');

        }

    };


    doDownloadRequest = async (url, options, fileName) => {

        return new Promise((resolve, reject) => {

            try {
                const req = this.https.request(url, options, (res) => {
                    console.log(`${new Date()} File Downloaded with status code ${res.statusCode}`);

                    if (res.statusCode === 200) {
                        res.setEncoding('base64');
                        let responseBody = '';

                        res.on('data', (chunk) => {
                            responseBody += chunk;
                        });

                        res.on('end', () => {

                            let storagePath = this.path.join(__dirname, '../downloads', fileName);

                            this.fs.writeFile(storagePath, responseBody, 'base64', function (err, data) {
                                console.log(`${new Date()} File Stored at ${storagePath}`);
                                resolve(responseBody);
                            });
                        });
                    } else {
                        reject('File may not be Preset at Dropbox');
                    }
                });

                req.on('error', (err) => {
                    reject(err);
                });

                req.end();

            } catch (e) {

                console.log(`${new Date()} Catch at File Uploading ${JSON.stringify(e)}`);
                reject(err);
            }
        });
    };

}

module.exports = Services;
