const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

//use cookie session instead
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000
}));

app.use(bodyParser.urlencoded({extended: false }));

//connect view ejs with server.js
app.set("view engine", "ejs");

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    userID: "testUser"
  },
  "abc123": {
    shortURL: "abc123",
    longURL: "http://www.bloop.com",
    userID: "testUser"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
 "testUser": {
    id: "testUser",
    email: "testUser@ex.com",
    password: "pass"
  }
};

app.get("/", (req, res) => {
  res.send(`Hello! WELCOME TO HELL!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


//generate random short url
function generateRandomString() {
  var randomString = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++) {
    randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return randomString;
}

//GET Register
app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.session.userID]
  }
  res.render("register", templateVars);
});

//GET Login
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session.userID]
  }
  res.render("login", templateVars);
});

function urlsForUser(id){
  const urls = {};
  for(let url in urlDatabase){
    if(urlDatabase[url].userID === id){
      urls[urlDatabase[url].shortURL] = urlDatabase[url].longURL;
    }
  }
  return urls;
}

//GET URLS
app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.session.userID],
    urls: urlsForUser(req.session.userID)
  };
  if(templateVars.user){
    res.render("urls_index", templateVars);
  }else{
    res.redirect("/register");
  }
});

//GET URLS/NEW
app.get("/urls/new", (req, res) => {
    let templateVars = {
    user: users[req.session.userID]
  };
  if(req.session.userID){
    res.render("urls_new", templateVars);
  }else{
    res.redirect('/login');
  }
});

//GET URLS/:id
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    user: users[req.session.userID],
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };
  if(templateVars.user){
    res.render("urls_show", templateVars);
  }else{
    res.redirect("/login");
  }
});

//GET URLS/:shortURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  if(longURL){
    res.redirect(longURL);
  }else{
    res.status(404).end();
  }
});

//Check user registered
function validUser(newuser){
  if(newuser.email === ""  || bcrypt.compareSync("", newuser.password)){
    return false;
  }
  for(user in users){
    if(users[user].email === newuser.email){
      return false;
    }
  }
  return true;
}

//POST Register
app.post("/register", (req, res) => {
  // const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  const newUser = {
    id: generateRandomString(),
    email: req.body.email,
    password: hashedPassword
  }
  if(validUser(newUser)){
    users[newUser.id] = newUser;
    req.session.userID = newUser.id;
    res.redirect('/urls');
  }else{
    res.status(400).send('Try to register again!');
  }
});

// POST new url to database
app.post("/urls", (req, res) => {

  if(users[req.session.userID]) {
    let urlId = generateRandomString();
    let longURL = req.body.longURL;
    urlDatabase[urlId] = {
      shortURL: urlId,
      longURL: longURL,
      userID: req.session.userID
    }
    res.redirect(`/urls/${urlId}`);
  }else {
    res.redirect('/login');
  }
});

// POST long url to database
app.post("/urls/:id", (req, res) => {
  let id = req.params.id;
  if(req.session.userID === urlDatabase[id].userID){
    urlDatabase[id].longURL = req.body.newurl;
  }
  res.redirect('/urls');
});

// POST delete url from database
app.post("/urls/:id/delete", (req, res) => {
  let url = req.params.id;
  if(req.session.userID === urlDatabase[url].userID){
    delete urlDatabase[url];
  }
  res.redirect('/urls');
});

// check user loggedin
function checkUser(email){
  for(const userId in users){
    const user = users[userId];
    if(user.email === email){
      return user;
    }
  }
}

//POST login
app.post("/login", (req,res) => {
  const user = checkUser(req.body.email);
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  if(!user || !bcrypt.compareSync(user.password, hashedPassword)){
    res.status(400).send('YOU SHALL NOT PASS!');
  }else{
    req.session.userID = user.id;
    res.redirect('/urls');
  }
});

//POST logout
app.post("/logout", (req,res) => {
  req.session = null;
  res.redirect('/login');
});