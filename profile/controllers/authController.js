const User = require("../models/User");
const jwt = require('jsonwebtoken');
const axios = require('axios')

// handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: '', password: '' };

  // incorrect email
  if (err.message === 'incorrect email') {
    errors.email = 'That email is not registered';
  }

  // incorrect password
  if (err.message === 'incorrect password') {
    errors.password = 'That password is incorrect';
  }

  // duplicate email error
  if (err.code === 11000) {
    errors.email = 'that email is already registered';
    return errors;
  }

  // validation errors
  if (err.message.includes('user validation failed')) {
    // console.log(err);
    Object.values(err.errors).forEach(({ properties }) => {
      // console.log(val);
      // console.log(properties);
      errors[properties.path] = properties.message;
    });
  }

  return errors;
}


// create json web token
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, process.env.APP_SECRET, {
    expiresIn: maxAge
  });
};

// controller actions
module.exports.signup_get = (req, res) => {
  res.send('signup page');
}

module.exports.login_get = (req, res) => {
  res.send('login page');
}

module.exports.signup_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.create({ email, password });
    const token = createToken(user._id);
    let userId = user._id
    let cart = await axios.post('http://localhost:3005/cart/cart_create', { userId } )
    let cartId  = cart.data._id
    
    // saving cartId into DB
    await User.findOneAndUpdate({_id:userId},{cartId:cartId})

    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.cookie('userId', user._id, { httpOnly: true, maxAge: maxAge * 1000 });
    res.cookie('cartId', cartId, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(201).json({ user: user._id });
  }
  catch(err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
 
}

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    
    // getting cartId from DB
    res.cookie('userId', user._id, { httpOnly: true, maxAge: maxAge * 1000 });
    res.cookie('cartId', user.cartId, { httpOnly: true, maxAge: maxAge * 1000 });

    res.status(200).json({ user: user._id });
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }

}

module.exports.logout_get = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 });
  res.cookie('userId', '', { maxAge: 1 })
  res.cookie('cartId', '', { maxAge: 1 })
  res.redirect('/');
}


