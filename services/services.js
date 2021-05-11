const envFile = require('dotenv').config();
const axios = require('axios').default;
const Promise = require('bluebird');


class Services {

    constructor(app) {
        this.https = app.https;
        this.fs = app.fs;
        this.path = app.path;
        this.accumulator =[]
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

        let response = await self.doUploadRequest(url, options, pathname, req.file.originalname);

        if (response.id) {
            console.log(`${new Date()} File ${response.name} of size ${response.size} Uploaded Successfully with Id ${response.id} `)
            res.redirect('/successUpload');
        } else {
            console.log(`${new Date()} Error while Uploading File`);
            res.redirect('/failure');
        }

    };

    doUploadRequest = async (url, options, uploadDataPath, originalname) => {

        console.log(`${new Date()} Uploading Data from Path ${uploadDataPath}`);

        return new Promise(async (resolve, reject) => {

            try {
                const req = this.https.request(url, options, async (res) => {
                    console.log(`${new Date()} File Uploaded with status code ${res.statusCode}`);

                    try {
                        await this.getPreview(originalname)
                    } catch (e) {
                        console.log(`${new Date()} File Preview Catch Data ${e}`);
                    }

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

    getPreview = async (fileName) => {

        const url = 'https://content.dropboxapi.com/2/files/get_preview';

        const options = {
            method: 'POST',
            headers: {
                'Authorization': process.env.token,
                'Dropbox-API-Arg': JSON.stringify({
                    'path': '/Uploads/' + fileName
                })
            }
        };
        // console.log(new Date() + " Options" + JSON.stringify(options));

        return new Promise((resolve, reject) => {

            try {
                const req = this.https.request(url, options, (res) => {
                    console.log(`${new Date()} File Preview Call ended with status code ${JSON.stringify(res.statusCode)}`);

                    if (res.statusCode === 200) {
                        res.setEncoding('base64');
                        let responseBody = '';

                        res.on('data', (chunk) => {
                            responseBody += chunk;
                        });

                        res.on('end', () => {
                            console.log(new Date() + " File Preview Result: ", responseBody)
                            resolve(responseBody)
                        });
                    } else {
                        reject('File Format Must be of .ai, .doc, .docm, .docx, .eps, .gdoc, .gslides, .odp, .odt, .pps, .ppsm, .ppsx, .ppt, .pptm, .pptx, .rtf.');
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

    getFilesList = async (req, res) => {

        console.log(`\n${new Date()} Request to Get the List of Files: ${JSON.stringify(req.body)}`);

        let response = await this.findListOfFiles(req.body.folder);

        if (response) {

            console.log("\n"+new Date()+ " Total Files Count: ",this.accumulator.length);
            console.log(new Date()+ " Files: ",this.accumulator);
            this.accumulator=[];

            res.redirect('/successCount');
        } else {
            console.log(`${new Date()} Error while Counting File`);
            res.redirect('/failure');
        }

    };

    findListOfFiles = async (folderName) => {

        let finalArray = [];

        let self = this;

        let path = "";
        if(folderName && folderName !== "/") {

            if(folderName[0]=== '/')path = folderName.toLowerCase();
            else path = '/'+folderName.toLowerCase();

        }
        console.log(`${new Date()} Getting Files from ${path}`);

        const url = 'https://api.dropboxapi.com/2/files/list_folder';

        let body = {
            "path": path,
            "recursive": false,
            "include_media_info": false,
            "include_deleted": false,
            "include_has_explicit_shared_members": false,
            "include_mounted_folders": true,
            "include_non_downloadable_files": true
        };

        const options = {
            method: 'POST',
            headers: {
                'Authorization': process.env.token,
                'Content-Type': "application/json"
            },
            data: body,
            url
        };

        // console.log("Options :", options);

        try {

            return await axios(options)

                .then(async (result) => {

                    if (result.status === 200) {

                        console.log(new Date() + " RESULT FOR FILE LIST POST CALL : " + JSON.stringify(result.data));
                        return await Promise.all(result.data.entries.map(async (oneData) => {
                            if (oneData['.tag'] === 'file') {
                                console.log(new Date() + " Name of File", oneData.name);
                                this.accumulator.push(oneData.name);
                                return oneData.name
                            } else if (oneData['.tag'] === 'folder') {
                                console.log("\n" + new Date() + " Folder: ", oneData.name);
                                return await this.findListOfFiles(oneData.path_lower);
                            }
                        }));

                    } else {
                        console.log(new Date() + " REQUEST FAILED WITH SATUS CODE : " + JSON.stringify(result.staus))
                        throw result;
                    }
                })
                .catch((e) => {

                    console.log(new Date() + " ERROR: ", e.response.data);
                    return e.response;

                })

        } catch (e) {
            console.log(`${new Date()} Catch at File Uploading ${JSON.stringify(e)}`);
            return e;
        }
    };

}

module.exports = Services;
