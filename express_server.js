const express = require("express");
const cookieParser = require('cookie-parser');
let cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { getUserByEmail } = require("./helpers.js");

// Creating an Express app
const app = express();
const PORT = 8080;

// Middleware for parsing cookies and managing sessions
app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ['key1', 'key2']
}));

// Setting the view engine to EJS
app.set("view engine", "ejs");

// Helper function to generate a random string
const generateRandomString = function() {
  const result = Math.random().toString(36).substring(2, 8);
  return result;
};

// Database of shortened URLs and user information
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

// Helper function to get user-specific URLs
const getUserfromReq = function(id, database) {
  let userUrl;
  for (const url in database) {
    if (database[url].userID === id) {
      userUrl[url] = database[url].longURL;
    }
  }
  return userUrl;
};

// Helper function to get URLs associated with a specific user
const urlsForUser = function(id, database) {
  const obj = {};
  for (const key in database) {
    if (database[key].userID === id) {
      obj[key] = database[key];
    }
  }
  return obj;
};

// Middleware for parsing URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Default route redirects to the login page
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Handling the creation of new shortened URLs
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

// Displaying the list of URLs for the logged-in user
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

// Rendering the page to create a new URL
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

// Displaying details of a specific URL
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

// Redirecting to the long URL when the short URL is accessed
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  const shortURL = req.params.id;
  if (!urlDatabase[shortURL].longURL) {
    res.status(400).send("Shortened ID does not exist");
    return;
  }
  res.redirect(longURL);
});

// Deleting a URL
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

// Editing a URL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

// Rendering the registration page
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

// Handling user registration
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

// Rendering the login page
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

// Handling user login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email === '' || password === '') {
    res.status(403).send("Please fill out the fields");
  } else {
    let user = getUserByEmail(email, users);
    if (!user) {
      res.status(403).send("User not found");
    } else {
      if (!bcrypt.compareSync(password, user.password)) {
        res.status(403).send("Email or Password not valid");
      } else {
        req.session.user_id = user.id;
        res.redirect("/urls");
      }
    }
  }
});

// Handling user logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Starting the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
