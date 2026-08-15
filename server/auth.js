const { OAuth2Client } = require("google-auth-library");
const User = require("./models/user");

// create a new OAuth client used to verify google sign-in
//    TODO: replace with your own CLIENT_ID
const CLIENT_ID = "927961037884-d14v6erf0d523objjaeqo3e7bahain68.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

// accepts a login token from the frontend, and verifies that it's legit
function verify(token) {
  return client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
  }).then((ticket) => ticket.getPayload());
}

// gets user from DB, or makes a new account if it doesn't exist yet
function getOrCreateUser(user) {
  // the "sub" field means "subject", which is a unique identifier for each user
  return User.findOne({ googleid: user.sub }).then((existingUser) => {
    if (existingUser) {
      return existingUser;
    }

    const newUser = new User({
      name: user.name,
      googleid: user.sub,
      scores: [],
      highScore: 0,
    });

    return newUser.save();
  });
}

function login(req, res) {
  verify(req.body.token)
    .then((user) => getOrCreateUser(user))
    .then((user) => {
      req.session.user = user;
      res.send(user);
    })
    .catch((err) => {
      console.error("Login failed:", err.message || err);
      res.status(401).send({ err: "Login failed" });
    });
}

function logout(req, res) {
  req.session.user = null;
  res.send({});
}

function populateCurrentUser(req, res, next) {
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
