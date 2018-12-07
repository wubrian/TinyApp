var express = require("express");
var app = express();
var PORT = 8080;
var cookieParser = require('cookie-parser');

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "abc123": "http://www.bloop.com"
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
    password: "test"
  }
};

function generateRandomString() {
  var randomString = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++) {
    randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return randomString;
}

//use body and cookie parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//connect view ejs with server.js
app.set("view engine", "ejs");

//render register.ejs
app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.cookies["userID"]]
  }
  res.render("register", templateVars);
});

//render login.ejs
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies["userID"]]
  }
  res.render("login", templateVars);
});

//render urls_index.ejs
app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.cookies["userID"]],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

//render urls_new.ejs
app.get("/urls/new", (req, res) => {
    let templateVars = {
    user: users[req.cookies["userID"]]
  };
  res.render("urls_new", templateVars);
});

//render urls_show.ejs
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    user: users[req.cookies["userID"]],
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if(longURL){
    res.redirect(longURL);
  }else{
    res.status(404).end();
  }
});

function validUser(user){
  // 1. CHECK IF user.email or user.password is an empty string
  // 2. loop through all of the users in the database to see if user.email already exists
  if(user.email === ""  || user.password === ""){
    return false;
  }
  for(ID in users){
    if(ID.email === user.email){
      return false;
    }
  }
  return true;
}

//post email and password
app.post("/register", (req, res) => {
  const user = {
    user_id: generateRandomString(),
    email: req.body.email,
    password: req.body.password
  }

  if(validUser(user)){
    users[user.user_id] = user;
    res.cookie("userID", user.user_id);
    res.redirect('/urls');
  }else{
    res.status(400).send('Sorry! Invalid!!');
  }
});

  // post new url to database
app.post("/urls", (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

// post long url to database
app.post("/urls/:id", (req, res) => {
  let id = req.params.id;
  urlDatabase[id] = req.body.newurl;
  res.redirect('/urls');
});

  // post delete url from database
app.post("/urls/:id/delete", (req, res) => {
  let url = req.params.id;
  delete urlDatabase[url];
  res.redirect('/urls');
});

function checkUser(email, password){
  for(const userId in users){
    if(users[userId].email === email){
      if(users[userId].password === password){
        return users[userId];
      }
      return undefined;
    }
  }
  return undefined;
}

//post login
app.post("/login", (req,res) => {
  const email = req.body.email;
  const password = req.body.password;
  const check = checkUser(email, password);
  if(check !== undefined){
    res.cookie("userID", check.id);
    res.redirect('/');
  }else{
    res.status(403).send("Can't find this user!");
  }
});

//post logout
app.post("/logout", (req,res) => {
  res.clearCookie("userID");
  res.redirect('/urls');
});


app.get("/", (req, res) => {
  res.send(`Hello!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});