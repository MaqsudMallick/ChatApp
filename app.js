const express = require('express')
const session = require('express-session')
const path = require('path')
const port = process.env.PORT || 3000
const app = module.exports = express()
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: false }))
app.use(express.static(__dirname))
app.use(session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'shhhh, very secret'
  }))
users = [{username:'a', password:'b'}, {username: 'bb', password: 'bb'}]
grp_msg = []
app.get('/', function(req, res){
    res.render('index.ejs');
});
app.get('/login', (req, res)=>{
    res.render('login.ejs')
})
app.get('/signup', (req, res)=>{
    res.render('signup.ejs')
})
app.get('/user', (req, res)=>{
    if(req.session.username==undefined) res.redirect('/login')
    else 
    res.render('multi.ejs', {msglist: grp_msg})
})
//POST
app.post('/user/send', (req, res)=>{
    grp_msg.push({username: req.session.username, message:req.body.message})
    res.redirect('/user')
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
        res.redirect('/user')
    }
})

app.listen(port, function() {
    console.log(`Server running on  localhost:${port}`)
})