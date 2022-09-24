require("dotenv").config()

const express = require("express")
const app = express();
const multer = require("multer")
const File = require("./models/File")

const upload = multer({dest:"uploads"})

const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

mongoose.connect(process.env.DATABASE_URLMDB)

app.use(express.static("public"))

app.set("view engine","ejs")
app.use(express.urlencoded({extended:true}))

app.get("/",(req,res)=>{
    res.render("index")
})

app.route("/file/:id").get(handleDownload).post(handleDownload)
app.route("/fileGet/forceGetAll").get(async (req,res)=>{
    const files = await File.find({})
    const paths = files.map(e => {
        return e.path
    })
    res.render("image",{image: paths})
})
app.route("/fileGet/:id").get(async (req,res)=>{
    const file = await File.findById(req.params.id)
    res.render("image",{image: file.path})
})


app.post("/upload", upload.single("file"),async (req,res)=>{
    const filename = {
        path: req.file.path,
        originalName: req.file.originalname
    }
    if(req.body.password !=null && req.body.password !==""){
        filename.password=await bcrypt.hash(req.body.password, 10)
    }

    const file = await File.create(filename)
    console.log(file)
    res.render("index",{fileLink:`${req.headers.origin}/file/${file.id}`})
})

app.get('/newFile',async (req,res)=>{
    const data = await File.findById('632ec2228e61d460c74ab8b3')
    res.json(data)
})

async function handleDownload(req,res){
    const file = await File.findById(req.params.id)

    if(file.password != null){
        if(req.body.password == null){
            res.render("password")
            return
        }
    }
    if(!(await bcrypt.compare(req.body.password, file.password))){
        res.render("password",{error:true})
        return
    }

    file.downloadCount++
    await file.save()
    res.download(file.path, file.originalName)
}




app.listen(process.env.PORT,()=>{
    console.log('Listening At:',process.env.PORT)
})