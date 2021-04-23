const servicesObj = require('../services/services.js');

class Controller {

    constructor(app) {
        this.app = app;
        this.upload = app.upload;
        this.path = app.path;
        this.actionsInstance = new servicesObj(app);
    }

    init = async () => {

        this.app.express.get('/', (req, res) => {
            res.sendFile(this.path.join(__dirname, '../view', 'index.html'));
        });

        this.app.express.get('/successUpload', (req, res) => {
            res.sendFile(this.path.join(__dirname, '../view', 'successUpload.html'));
        });
        this.app.express.get('/successDownload', (req, res) => {
            res.sendFile(this.path.join(__dirname, '../view', 'successDownload.html'));
        });

        this.app.express.get('/failure', (req, res) => {
            res.sendFile(this.path.join(__dirname, '../view', 'failure.html'));
        });

        this.app.express.post('/upload', this.upload.single('file-to-upload'), async (req, res) => {
            try{
                console.log(`${new Date()} Request to Upload: ${JSON.stringify(req.body)}`);
                await this.actionsInstance.uploadFile(req,res);
            }
            catch(e){
                console.log(`${new Date()} Error While Uploading: ${JSON.stringify(e)}`);
                res.redirect('/failure');
            }

        });


        this.app.express.post('/download', async (req, res) => {

            try{
                console.log(`\n${new Date()} Request to Download: ${JSON.stringify(req.body)}`);
                await this.actionsInstance.downloadFile(req,res);
            }
            catch(e){
                console.log(`${new Date()} Error While Uploading: ${JSON.stringify(e)}`);
                res.redirect('/failure');
            }
        });
    }}

module.exports = Controller;




