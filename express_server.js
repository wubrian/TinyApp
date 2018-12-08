const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000
}));

app.use(bodyParser.urlencoded({extended: false }));

app.set("view engine", "ejs");

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//testing url db
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

//testing user db
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
  res.send(`Hello! WELCOME TO TinyApp!`);
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
    res.redirect("/login");
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
  if(urlDatabase[req.params.id]){
    if(users[req.session.userID]){
      let templateVars = {
        user: users[req.session.userID],
        shortURL: req.params.id,
        longURL: urlDatabase[req.params.id].longURL
      };
       res.render("urls_show", templateVars);
    }else {
      res.redirect("/login");
    }
  }else {
    res.send("Sorry! The Id does not exists in the database.")
  }
});

//GET URLS/:shortURL
app.get("/u/:shortURL", (req, res) => {
  if(urlDatabase[req.params.shortURL]){
    let longURL = urlDatabase[req.params.shortURL].longURL;
    if(longURL){
      res.redirect(longURL);
    }else{
      res.send("The Long URL does not exitst");
    }
  }else{
    res.send("The given ID does not exist");
  }
});

//Check user email registered
function validUser(email){
  for(user in users){
    if(users[user].email === email){
      return true;
    }
  }
}

//POST Register
app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  if(!email || !password) {
    res.send('Sorry! Cant register. Both email and password are required');
  }else {
    if(validUser(email)){
      res.send('Sorry!. Email already taken');
    }else {
      const hashedPassword = bcrypt.hashSync(req.body.password, 10);
      const newUser = {
        id: generateRandomString(),
        email: req.body.email,
        password: hashedPassword
      };
      users[newUser.id] = newUser;
      req.session.userID = newUser.id;
      res.redirect('/urls');
    }
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
  if(!user || !bcrypt.compareSync(req.body.password, user.password)){
    res.status(400).send('YOU SHALL NOT PASS!....Log in input is incorrect');
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