var express = require("express");
var app = express();
var PORT = 8080;
var cookieParser = require('cookie-parser');

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "abc123": "http://www.bloop.com"
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

//render urls_index.ejs
app.get("/urls", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

//render urls_new.ejs
app.get("/urls/new", (req, res) => {
    let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

//render urls_show.ejs
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
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


  // add new url to database
app.post("/urls", (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

// update long url to database
app.post("/urls/:id", (req, res) => {
  let id = req.params.id;
  urlDatabase[id] = req.body.newurl;
  res.redirect('/urls');
});

  // delete url from database
app.post("/urls/:id/delete", (req, res) => {
  let url = req.params.id;
  delete urlDatabase[url];
  res.redirect('/urls');
});

//login username
app.post("/login", (req,res) => {
  let username = "username";
  res.cookie(username, req.body.username);
  console.log(req.body.username);
  res.redirect('/urls');
});

//logout username
app.post("/logout", (req,res) => {
  res.clearCookie("username");
  res.redirect('/urls');
});


app.get("/", (req, res) => {
  res.send("Hello!");
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