const express = require("express");
const cookieParser = require('cookie-parser');
let cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { getUserByEmail } = require("./helpers.js");
const app = express();
const PORT = 8080;

// Middleware setup
app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ['key1', 'key2']
}));

app.set("view engine", "ejs");

// Helper function to generate a random string
const generateRandomString = function() {
  const result = Math.random().toString(36).substring(2,8);
  return result;
};

// Database for storing URLs and users
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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

// Function to get user URLs from the database
const getUserfromReq = function(id, database) {
  let userUrl;
  for (const url in database) {
    if (database[url].userID === id) {
      userUrl[url] = database[url].longURL;
    }
  }
  return userUrl;
};

// Function to get URLs associated with a user
const urlsForUser = function(id, database) {
  const obj = {};
  for (const key in database) {
    if (database[key].userID === id) {
      obj[key] = database[key];
    }
  }
  return obj;
};

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Route to handle URL creation
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.status(400).send("You are not logged in");
    return;
  }
  console.log(req.body); 
  const newKey = generateRandomString();
  const newURL = req.body['longURL'];
  urlDatabase[newKey] = {
    longURL: newURL,
    userId
  };
  res.redirect(`urls/`);
});

// Route to display URLs for the logged-in user
app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    const templateVars = {
      urls: urlsForUser(req.session.user_id.id, urlDatabase),
      user: users[req.session.user_id]
    };
    res.render("urls_index", templateVars);
    return;
  } else {
    res.status(400).send("You are not logged in");
  }
});

// Route to render the form for creating a new URL
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new", templateVars);
});

// Route to display a specific URL
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.status(400).send("You are not logged in");
    return;
  }
  const shortURL = req.params.id;
  const user = users[userId];
  const userURLS = urlsForUser(user.id, urlDatabase);
  const doesUrlBelong = userURLS[shortURL.userID] === urlDatabase[shortURL].userID;
  if (doesUrlBelong) {
    // Restrict user b from user a URL
    // urlDatabase[req.params.id].userID
    const templateVars = {
      user,
      longURL: urlDatabase[req.params.id].longURL,
      id: shortURL
    };
    res.render("urls_show", templateVars);
    return;
  } else {
    res.status(400).send("Do not have access");
  }
});

// Route to redirect to the long URL when given a short URL
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  if (!urlDatabase[shortURL] || !urlDatabase[shortURL].longURL) {
    res.status(400).send("Shortened ID does not exist");
    return;
  }
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// Route to handle URL deletion
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.status(400).send("You are not logged in");
    return;
  }
  const id = req.params.id;
  const user = users[req.session.user_id];
  if (user.id === urlDatabase[id].userId) {
    delete urlDatabase[id];
    return res.redirect("/urls");
    
  } else {
    res.status(400).send("Do not have access");
  }
});

// Route to handle URL update
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

// Route to render the registration form
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  res.render("urls_register", templateVars);
});

// Route to handle user registration
app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send("Email/password are empty");
    return;
  } else if (getUserByEmail(req.body.email, users)) {
    res.status(400).send("User already exists.");
    return;
  }
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  users[id] = {
    id,
    email: req.body.email,
    password: hashedPassword
  };
  req.session.user_id = users[id].id;
  res.redirect("/urls");
});

// Route to render the login form
app.get("/login", (req, res) => {
  const templateVars = {
    user: getUserfromReq(req)
  };
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  res.render("urls_login", templateVars);
});

// Route to handle user login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email === '' || password === '') {
    res.status(403).send("Cannot leave fields empty");
  } else {
    let user = getUserByEmail(email, users);
    if (!user) {
      res.status(403).send("User not found");
    } else {
      if (!bcrypt.compareSync(password, user.password)) {
        res.status(403).send("Passwords are not valid");
      } else {
        req.session.user_id = user.id;
        res.redirect("/urls");
      }
    }
  }
});

// Route to handle user logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Default route to redirect to login
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
