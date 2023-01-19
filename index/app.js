!bin/bash
const express = require('express');
const validator = require('validator');
const { MongoClient} = require("mongodb");
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
const { urlencoded } = require('body-parser');
const dotenv = require('dotenv')
const jwt =require('jsonwebtoken')
const app = express();
//hiding sensitive info
dotenv.config();
// mongodb connect
const client = new MongoClient(process.env.DB_CONNECT, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
try {
  await client.connect();
  console.log('database connected');
} catch (error) {
  console.error(error);
}
//middle ware to accept input as json
app.use(bodyParser.json())
//middle ware to accept input as string or array from form
app.use(express.urlencoded({extended: false}))
// to render doc as html format
app.set('view engine', 'ejs')
app.get('/homepage',(req,res)=>{
  res.render('homepage.ejs')
})
//showing the login page on the browser
app.get('/login', (req, res)=>{
  res.render('login.ejs')
})
//showing the registration page on browser
app.get('/register', (req, res)=>{
  res.render('register.ejs')
})
// func to add to data base
async function add (newUser){
  try {
    await client.db("wiggs_school").collection("user_password").insertMany([newUser]);
    console.log('user added sucessfully')
  } catch (error) {
    console.error(error)
  }
}
//to get details from the registration page
app.post('/register', async(req, res) => {
  try {
    const user = await client.db("wiggs_school").collection("user_password").findOne({ email:req.body.email });
    const User = await client.db('wiggs_school').collection('user_password').findOne({ username:req.body.username });
    // validate if email exist
    if (user) {
      res.send('email exist')
      //validate if email is in correct format
    } else if (!validator.isEmail(req.body.email)) {
      res.send('Invalid email format');
      //compare passwords
    } else if (req.body.password !== req.body.confirm_password) {
      res.send('password do not match')
      // validating username
    } else if (User) {
      res.send('username already taken')
    } else {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const hashedConfirmPassword = await bcrypt.hash(req.body.confirm_password, 10);
      const newUser = {
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        confirm_password: hashedConfirmPassword,
        phone_number: req.body.phone_number
      };
      // func to collect the details and send to database
      await add(newUser);
    }
    // to redirect back to login page after user submit registration page
    res.redirect('/login');
  } catch (error) {
    console.error(error);
    // Handle the error here, for example by sending a response back to the client
    res.send('An error occurred');
  }
})
app.post('/login', async(req,res)=>{
  const User = await client.db('wiggs_school').collection('user_password').findOne({ username:req.body.username });
  // validation for username
  if (!User) {
    console.log(User)
    res.send('invalid user')
  }
  //validation for password
  const valid = await bcrypt.compare(req.body.password, User.password);
  if (!valid) {
    res.send('invalid password')
  }
  //jwt auth
  const token = jwt.sign({ _id: User._id}, process.env.KEY)
  console.log(token)
  res.redirect('homepage')
})
app.listen(3000, ()=>{
  console.log('connected sucessfully')
});
