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

        this.app.express.get('/success', (req, res) => {
            res.sendFile(this.path.join(__dirname, '../view', 'success.html'));
        });

        this.app.express.get('/failure', (req, res) => {
            res.sendFile(this.path.join(__dirname, '../view', 'failure.html'));
        });

        this.app.express.post('/upload', this.upload.single('file-to-upload'), async (req, res) => {

            try{

                let response = await this.actionsInstance .uploadFile(req,res);

                if(response.id){
                    console.log(`${new Date()} File ${response.name} of size ${response.size} Uploaded Successfully with Id ${response.id} `)
                    res.redirect('/success');
                }
                else{
                    console.log(`${new Date()} Error while Uploading File`);
                    res.redirect('/failure');
                }
            }

            catch(e){
                console.log(`${new Date()} Error While Uploading: ${JSON.stringify(e)}`);
                res.redirect('/failure');
            }

        });
    }}

module.exports = Controller;




