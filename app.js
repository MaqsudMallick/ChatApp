const express = require('express')
const session = require('express-session')
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const app = module.exports = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const port = process.env.PORT || 3000

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: false }))
app.use(express.static(__dirname))
app.use(session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'shhhh, very secret'
  }))
io.on('connection', (socket) =>{
    //console.log('connection socket')   
})
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
  
        // Uploads is the Upload_folder_name
        cb(null, req.session.username)
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
const upload = multer({storage: storage})
//Dummy Database
users = [{username:'a', password:'b'}, {username: 'bb', password: 'bb'}]
grp_msg = []
user_grps = []
msg = [{sender:'a', receiver:'bb', message: {msg: 'hello', file: 'Logo.png'} }]
app.get('/', function(req, res){
    res.render('index.ejs');
});
app.get('/login', (req, res)=>{
    res.render('login.ejs')
})
app.get('/signup', (req, res)=>{
    res.render('signup.ejs')
})
app.get('/user/multi', (req, res)=>{
    if(req.session.username==undefined) res.redirect('/login')
    else {        
        res.render('multi.ejs', {msglist: grp_msg.slice().reverse()})
    }
})
app.get('/user/contacts', (req, res)=>{
    if(req.session.username==undefined) res.redirect('/login')
    else{
    users_with_first_msg = users.map(u=>msg.findLast(e=> (e.sender==req.session.username&&e.receiver==u.username) || e.receiver==req.session.username&&e.sender==u.username)).filter(e=>e!=undefined).map(e=>e.sender==req.session.username?{u: e.receiver, msg: e.message.msg}:{u: e.sender, msg: e.message.msg})
    
    grpname_with_last_msg = user_grps.filter(e=>e.messages.length!=0).map(e=>[e.group_name,e.messages[e.messages.length-1].message])
  
        res.render('contacts.ejs', {grps_with_last_msg: grpname_with_last_msg,users_with_first_msg: users_with_first_msg,username: req.session.username, users: users.map(e=>e.username), groups: user_grps.map(e=>e.group_name)})
    }
})
app.get('/user/:fr', (req, res)=>{
    if(req.session.username== undefined) res.redirect('/login')
    else{
        //console.log(msg.filter(e=>(e.sender==req.session.username&&e.receiver==req.params.fr)||(e.sender==req.params.fr&&e.receiver==req.session.username)))
        res.render('uni.ejs', {username:req.session.username,receiver:req.params.fr ,msglist: msg.filter(e=>(e.sender==req.session.username&&e.receiver==req.params.fr)||(e.sender==req.params.fr&&e.receiver==req.session.username)).slice().reverse()})
    }
})
app.get('/user/group/:grp', (req, res)=>{
    if(req.session.username== undefined) res.redirect('/login')
    else{
        this_grp = user_grps.find(e=>e.group_name==req.params.grp)
        if(this_grp==undefined) res.redirect('/user/contacts')
        // console.log(this_grp.admins.find(e=>e==req.session.username)!=undefined)
        if(this_grp.admins!=undefined && this_grp.admins.find(e=>e==req.session.username)!=undefined) 
        res.render('grp_admin.ejs', {group_name:req.params.grp, msglist: this_grp.messages.slice().reverse(), adminlist: this_grp.admins, memberlist: this_grp.members})
        else if(this_grp.members!=undefined && this_grp.members.find(e=>e==req.session.username)!=undefined)
        res.render('grp.ejs', {group_name:req.params.grp, msglist: this_grp.messages.slice().reverse()})
        else res.send('Sorry you are not part of this group <a href="/user/contacts">Contacts</a>')
    }
})
//POST
app.post('/user/group/:grp/send', upload.single('fileupload'),(req, res)=>{
    if(req.file==undefined)
    user_grps.find(e=>e.group_name==req.params.grp).messages.push({username: req.session.username, message:req.body.message, file: undefined})
    else 
    user_grps.find(e=>e.group_name==req.params.grp).messages.push({username: req.session.username, message:req.body.message, file: req.file.originalname})
    io.emit(req.params.grp)
   // io.emit('contacts')
    res.redirect('/user/group/'+req.params.grp)
})
app.post('/user/creategroup', (req, res)=>{
    members  = Object.keys(req.body).filter(key=>key!='group_name'&&req.body[key]=='on')
    user_grps.push({group_name:req.body.group_name, admins: [req.session.username], members: members, messages: []})
    res.redirect('/user/contacts')

})
app.post('/user/multi/send',upload.single('fileupload'), (req, res)=>{
    if(req.file!=undefined)
        grp_msg.push({username: req.session.username ,message:req.body.message, file: req.file.originalname})
    else
        grp_msg.push({username: req.session.username ,message:req.body.message, file: undefined})
    io.emit('refresh', grp_msg)
   // io.emit('contacts')
    res.redirect('/user/multi')
    
})
app.post('/user/:fr/send', upload.single('fileupload'), (req, res)=>{
    if(req.file==undefined)
    msg.push({sender: req.session.username, receiver: req.params.fr, message:{msg: req.body.message, file:undefined}})
    else
    msg.push({sender: req.session.username, receiver: req.params.fr, message:{msg: req.body.message, file:req.file.originalname}})
    io.emit(req.params.fr)
   // io.emit('contacts')
    res.redirect('/user/' + req.params.fr)
})

app.post('/login', (req, res) =>{
    res.redirect('/login')
})
app.post('/signup', (req, res) => {
    res.redirect('/signup')
})
app.post('/signupconfirm', (req, res) =>{
    username = req.body.username
    password = req.body.password
    if(username != '' && password != '' && users.find(ele => ele.username == username) == undefined){
    users.push({username, password})
    console.log(`New User Signup`) 
    console.log(`${username}: ${password}`)
    if (!fs.existsSync(username)){
        fs.mkdirSync(username);
    }
    res.send('Signup Successful <br/> <a href= "/">Home</a>')}
    else res.send('Failure. Please enter proper username and password <br/> <a href= "/signup">Try Again</a>')
})
app.post('/loginconfirm', (req, res) =>{
    username = req.body.username
    password = req.body.password
    obj = users.find(ele => ele.username == username)
  //  obj2 = admins.find(ele => ele.username == username)

    if( obj == undefined) res.send('No such username registered <br/> <a href= "/login">Try Again</a><br/> <a href= "/signup">Sign Up?</a>')
    else if(obj.password != password) res.send('Wrong Password <br/> <a href= "/login">Try Again</a>')
    else {
        req.session.username = username
        res.redirect('/user/contacts')
    }
})
app.post('/user/group/:grp/upgrade/:user', (req, res)=>{
    this_grp= user_grps.find(e=>e.group_name==req.params.grp)
    this_grp.admins.push(req.params.user)
    this_grp.members = this_grp.members.filter(e=>e!=req.params.user)
    io.emit(req.params.grp)
    res.redirect('/user/group/'+req.params.grp)
})
app.post('/user/group/:grp/leave', (req, res)=>{
    this_grp = user_grps.find(e=>e.group_name==req.params.grp)
    if(this_grp.admins!=undefined)
        this_grp.admins = this_grp.admins.filter(e=>e!=req.session.username)
    if(this_grp.members!=undefined)
        this_grp.members = this_grp.members.filter(e=>e!=req.session.username)
    res.redirect('/user/contacts')
})
// app.post('/user/group/:grp/downgrade', (req, res)=>{
//     this_grp = user_grps.find(e=>e.group_name==req.params.grp)
    
//     this_grp = this_grp.admins.filter(e=>e!=req.session.username)
//     if(this_grp.members!=undefined)
//         this_grp.members.push(req.session.username)
//     else 
//         this_grp.members  = [req.session.username]
//     res.redirect('/user/group/' + req.params.grp)
// })
http.listen(3000, ()=>console.log(`Server running on localhost:${port}`))