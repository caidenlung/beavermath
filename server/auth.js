const { OAuth2Client } = require("google-auth-library");
const User = require("./models/user");
const socketManager = require("./server-socket");

// create a new OAuth client used to verify google sign-in
//    TODO: replace with your own CLIENT_ID
const CLIENT_ID = "927961037884-d14v6erf0d523objjaeqo3e7bahain68.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

// accepts a login token from the frontend, and verifies that it's legit
function verify(token) {
  console.log("Starting token verification...");
  return client
    .verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    })
    .then((ticket) => {
      console.log("Token verified successfully");
      const payload = ticket.getPayload();
      console.log("User email domain:", payload.email.split('@')[1]);
      return payload;
    })
    .catch((err) => {
      console.error("Token verification failed:", err);
      throw err;
    });
}

// gets user from DB, or makes a new account if it doesn't exist yet
function getOrCreateUser(user) {
  console.log("Getting or creating user for:", user.email);
  // the "sub" field means "subject", which is a unique identifier for each user
  return User.findOne({ googleid: user.sub }).then((existingUser) => {
    if (existingUser) {
      console.log("Found existing user");
      return existingUser;
    }

    console.log("Creating new user");
    const newUser = new User({
      name: user.name,
      googleid: user.sub,
    });

    return newUser.save();
  });
}

function login(req, res) {
  console.log("Login attempt started");
  verify(req.body.token)
    .then((user) => {
      console.log("User verified, proceeding to database");
      return getOrCreateUser(user);
    })
    .then((user) => {
      console.log("User successfully logged in:", user.name);
      // persist user in the session
      req.session.user = user;
      res.send(user);
    })
    .catch((err) => {
      console.error("Login failed with detailed error:", err);
      res.status(401).send({ err: err.toString() });
    });
}

function logout(req, res) {
  req.session.user = null;
  res.send({});
}

function populateCurrentUser(req, res, next) {
  // simply populate "req.user" for convenience
  req.user = req.session.user;
  next();
}

function ensureLoggedIn(req, res, next) {
  if (!req.user) {
    return res.status(401).send({ err: "not logged in" });
  }

  next();
}

module.exports = {
  login,
  logout,
  populateCurrentUser,
  ensureLoggedIn,
};
