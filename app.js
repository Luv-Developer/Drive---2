const express = require("express")
const app = express()
const PORT = 3000
const path = require("path")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const {createClient} = require("@supabase/supabase-js")
const multer = require("multer")
const crypto = require("crypto")
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"public")))
app.use(cookieParser())
app.set("view engine","ejs")

const supabaseurl = "https://tgulchyaoxlspxdnthcp.supabase.co"
const supabasekey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndWxjaHlhb3hsc3B4ZG50aGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNTk4OTcsImV4cCI6MjA1MzYzNTg5N30.-zMQ8YctfJQSZ-aFLc5sYoHTAxpiVsw-gY8jm8xOO58"
const supabase = createClient(supabaseurl,supabasekey)

app.get("/",(req,res)=>{
    res.render("homepage")
})
app.get("/register",(req,res)=>{
    res.render("register")
})
app.post("/register",async(req,res)=>{
    const {username,email,password} = req.body
    const salt = await bcrypt.genSalt(10)
    const hashedpassword = await bcrypt.hash(password,salt)
    const user = await supabase
    .from("users3")
    .insert([{username,email,password:hashedpassword}])
    if(user){
        let token = jwt.sign({email},"hehe")
        res.cookie("token",token)
        res.redirect("/")
    }
    else{
        res.render("register")
    }
})
app.get("/login",(req,res)=>{
    res.render("login")
})
app.post("/login",async(req,res)=>{
    const {email,password} = req.body
    let {data:user,error} = await supabase
    .from("users3")
    .select("*")
    .eq("email",email)
    .single()
    if(!user){
        res.render("register")     
    }
    const verifieduser = await bcrypt.compare(password,user.password)
    if(!verifieduser){
        return res.redirect("/login")
    }
    else{
        let token = jwt.sign({email},"hehe")
        res.cookie("token",token)
        return res.redirect("/")
    } 
})
function isloggedin(req,res,next){
    if(req.cookies.token === ""){
        res.redirect("/login")
        next()
    }
    else{
        let data = jwt.verify(req.cookies.token,"hehe")
        req.user = data
        next()
    }
}
app.get("/drive",isloggedin,async(req,res)=>{
    const user = await supabase
    .from("users3")
    .select("*")
    .eq("email",req.user.email)
    .single()
    res.render("drive",{user})
})
//Multer 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,"./public/images/uploads")
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(12,(err,bytes)=>{
            const fn = bytes.toString("hex") + path.extname(file.originalname)
            cb(null,fn)
        })
    }
  })
const upload = multer({ storage: storage })
app.post("/drive",upload.single('files'),async(req,res)=>{
    console.log(req.file)
})
app.get("/logout",(req,res)=>{
    res.cookie("token","")
    res.redirect("/login")
})
app.listen(PORT,()=>{
    console.log(`App is listening at ${PORT}`)
})