const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

function generateRandomString() {}

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id]; // Retrieve the long URL from urlDatabase
  
  const templateVars = { id: id, longURL: longURL };
  res.render("urls_show", templateVars);
  
});
const templateVars = { greeting: "Hello World!" };
//in the localhost:8080 web shows Hello!
app.get("/", (req, res) => {
  res.send("Hello!");
});

//in the http://localhost:8080/urls.json shows the URL
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
//in http://localhost:8080/hello. shows hello world
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
 });
 
 app.get("/urls", (req, res) => { //to render the urls_index.ejs template and pass the urlDatabase to it.
  res.render("urls_index", { urls: urlDatabase });
});
app.get("/hello", (req, res) => {
  res.render("hello_world",{templateVars: templateVars});
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  res.send("Ok"); // Respond with 'Ok' (we will replace this)
});


app.post("/login", (req, res) => {
  const username = req.body.username; // Get the username from the request body
  res.cookie('username', username); // Set the username in a cookie
  res.redirect("/urls"); // Redirect back to the /urls page
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id]; // Retrieve the long URL from urlDatabase
  res.redirect(longURL);
});
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (urlDatabase[id]) {
    delete urlDatabase[id];
    res.redirect("/urls"); 
  }
});
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL; 
  urlDatabase[id] = newLongURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


