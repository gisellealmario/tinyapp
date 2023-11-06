const express = require("express");
const app = express();
const PORT = 8080; // Default port 8080
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

function generateRandomString() {
  // Your implementation of generateRandomString
  // ...
}

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// Root route
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Display JSON data for URL database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Sample route with HTML response
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Sample route to display a variable value
app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});

// URL List route
app.get("/urls", (req, res) => {
  const userId = req.cookies["userId"]; 
  const user = users[userId];

  const templateVars = {
    user: user,
    urls: urlDatabase,
    // ... any other vars
  };
  res.render("urls_index", templateVars);
});

// New URL route
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["userId"]; // Retrieve the user's ID from the cookie
  const user = users[userId];

  const templateVars = {
    user: user,
    // ... any other vars
  };
  res.render("urls_new", templateVars);
});

// Show specific URL
app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];

  const templateVars = { id: id, longURL: longURL };
  res.render("urls_show", templateVars);
});

// Redirect route
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

// Sample POST route (log request body)
app.post("/urls", (req, res) => {
  console.log(req.body);
  res.send("Ok");
});

// Login route
app.post("/login", (req, res) => {
  const userEmail = req.body.user;

  // Find the user by their email in your users object
  for (const userId in users) {
    if (users[userId].email === userEmail) {
      const userId = users[userId].id;
      res.cookie('userId', userId);
      res.redirect("/urls");
      return;
    }
  }
  res.status(401).send("Authentication failed"); 
});

// POST Logout route
app.post("/logout", (req, res) => {
  res.clearCookie('userId'); 
  res.redirect("/urls");
});

// Delete URL route
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (urlDatabase[id]) {
    delete urlDatabase[id];
    res.redirect("/urls");
  }
});

// Registration form route
app.get("/register", (req, res) => {
  res.render("registration");
});

// POST Registration route
// Helper function to get a user by email
const getUserByEmail = (email) => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
};

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // Check if email and password are empty
  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  // Check if the email already exists
  if (getUserByEmail(email)) {
    return res.status(400).send("Email already exists");
  }

  const userId = generateRandomString();

  const newUser = {
    id: userId,
    email: email,
    password: password,
  };

  users[userId] = newUser;

  res.cookie("userId", userId); 
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const userId = req.cookies.userId;
  const user = users[userId];

  res.render("registration", user); 
});


app.get("/login", (req, res) => {
  const userId = req.cookies["userId"]; 
  const user = users[userId];

  const templateVars = {
    user: user,
    urls: urlDatabase,
    // ... any other vars
  };
  res.render("logIn_template", templateVars)
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
