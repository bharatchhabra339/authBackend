const User = require('../models/user.js');
const bcrypt = require('bcrypt');
var config = require('../../config/database.config');
var jwt = require('jsonwebtoken');
var VerifyToken = require('./VerifyToken');

// Create and Save a new user
exports.create = (req, res) => {
  // Validate request
  if (!req.body.password) {
    return res.status(400).send({
      message: 'user password can not be empty',
    });
  }
  const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!req.body.email) {
    return res.status(400).send({
      message: 'user email can not be empty',
    });
  }
  if (!emailRegexp.test(req.body.email)) {
    return res.status(400).send({
      message: 'please enter the valid email format',
    });
  }
  var hashedPassword = bcrypt.hashSync(req.body.password, 8);

  // Create a user
  const user = new User({
    email: req.body.email || 'Untitled User',
    password: hashedPassword,
  });

  var token = jwt.sign({ id: user._id }, config.secret, {
    expiresIn: 86400, // expires in 24 hours
  });
  // Save user in the database
  user
    .save()
    .then((data) => {
      res.send({
        _id: data._id,
        token: token,
        email: data.email,
        password: data.password,
      });
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || 'Some error occurred while creating the user.',
      });
    });
};

// Retrieve and return all users from the database.
exports.findAll = (req, res) => {
  User.find()
    .then((user) => {
      res.send(user);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving user.',
      });
    });
};

// Find a single user with a userId
exports.findOne = (req, res) => {
  User.findById(req.params.userId)
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          message: 'user not found with id ' + req.params.userId,
        });
      }
      User.findById(req.userId, function (err, user) {
        if (err)
          return res.status(500).send('There was a problem finding the user.');
        if (!user) return res.status(404).send('No user found.');

        res.status(200).send(user);
      });
    })
    .catch((err) => {
      if (err.kind === 'ObjectId') {
        return res.status(404).send({
          message: 'user not found with id ' + req.params.userId,
        });
      }
      return res.status(500).send({
        message: 'Error retrieving user with id ' + req.params.userId,
      });
    });
};

// Update a user identified by the userId in the request
exports.update = (req, res) => {
  // Validate Request
  if (!req.body.password) {
    return res.status(400).send({
      message: 'user password can not be empty',
    });
  }
  var hashedPassword = bcrypt.hashSync(req.body.password, 8);
  // Find user and update it with the request body

  const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!req.body.email) {
    return res.status(400).send({
      message: 'user email can not be empty',
    });
  }
  if (!emailRegexp.test(req.body.email)) {
    return res.status(400).send({
      message: 'please enter the valid email format',
    });
  }

  User.findByIdAndUpdate(
    req.params.userId,
    {
      email: req.body.email || 'email invalid',
      password: hashedPassword,
    },
    { new: true },
  )
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          message: 'user not found with id ' + req.params.userId,
        });
      }
      res.send(user);
    })
    .catch((err) => {
      if (err.kind === 'ObjectId') {
        return res.status(404).send({
          message: 'user not found with id ' + req.params.userId,
        });
      }
      return res.status(500).send({
        message: 'Error updating user with id ' + req.params.userId,
      });
    });
};

// Delete a user with the specified userId in the request
exports.delete = (req, res) => {
  User.findByIdAndRemove(req.params.userId)
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          message: 'user not found with id ' + req.params.userId,
        });
      }
      res.send({ message: 'user deleted successfully!' });
    })
    .catch((err) => {
      if (err.kind === 'ObjectId' || err.name === 'NotFound') {
        return res.status(404).send({
          message: 'user not found with id ' + req.params.userId,
        });
      }
      return res.status(500).send({
        message: 'Could not delete user with id ' + req.params.userId,
      });
    });
};

exports.login = (req, res) => {
  User.findOne({ email: req.body.email }).then((user) => {
    if (!user) return res.status(404).send('No user found.');

    var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid)
      return res.status(401).send({
        auth: false,
        message: `Email and Password doesn't match`,
      });

    var token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: 86400, // expires in 24 hours
    });

    res.status(200).send({ auth: true, token: token });
  });
};
