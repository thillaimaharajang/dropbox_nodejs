const servicesObj = require('../services/services.js');

class Controller {

    constructor(app) {
        this.app = app;
        this.upload = app.upload;
        this.path = app.path;
        this.serviceInstance = new servicesObj(app);
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
        this.app.express.get('/successCount', (req, res) => {
            res.sendFile(this.path.join(__dirname, '../view', 'successCount.html'));
        });

        this.app.express.get('/failure', (req, res) => {
            res.sendFile(this.path.join(__dirname, '../view', 'failure.html'));
        });


        this.app.express.post('/upload', this.upload.single('file-to-upload'), async (req, res) => {
            this.serviceInstance.uploadFile(req,res);
        });


        this.app.express.post('/download', async (req, res) => {
            this.serviceInstance.downloadFile(req,res);
        });

        this.app.express.post('/files_count', async (req, res) => {
            this.serviceInstance.getFilesList(req,res);
        });
    }}

module.exports = Controller;




