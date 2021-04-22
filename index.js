const express = require('express');
const multer = require('multer');
const app = express();

const actionsObj = require('./actions/actions.js');
const actionObject = new actionsObj();

const storage = multer.diskStorage({
    destination : (req,file,cb) => {
        cb(null,'uploads')
    },
    filename : (req,file,cb) => {
        console.log(`\n${new Date()} Recieved File: ${file.originalname}`)
        cb(null,file.originalname)
    }
})

const upload = multer({storage:storage}); 

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/view/index.html');
});

app.get('/success', (req, res) => {
    res.sendFile(__dirname + '/view/success.html');
});

app.get('/failure', (req, res) => {
    res.sendFile(__dirname + '/view/failure.html');
});

app.post('/upload', upload.single('file-to-upload'), async (req, res) => {

    let response = await actionObject.uploadFile(req,res)

    if(response.status === 200){
        console.log(`${new Date()} File ${response.data.name} of size ${response.data.size} Uploaded Successfully with Id ${response.data.id} `)
        res.redirect('/success');
    }
    else{
        console.log(`${new Date()} Error while Uploading File`)
        res.redirect('/failure');
    }

});

app.listen(3000, ()=> { console.log("Server Running at http://localhost:3000")});

