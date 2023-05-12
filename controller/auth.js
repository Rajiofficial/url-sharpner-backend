import usersDetails from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import randomstring from 'randomstring';

const securePassword = async (password) => {
  let salt = await bcrypt.genSalt(10);
  var hash = await bcrypt.hash(password, salt);
  return hash;
};

// email account activate
export const accountActivateMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    var message = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'For activate Account',
      html:
        '<p> Hi ' +
        name +
        ', Please click <a href="https://shortly-url-shortener-app.netlify.app/#/sign-up/' +
        token +
        '"> here </a> to activate your account.The link will be expired in 15 minutes.</p>',
    };

    transporter.sendMail(message, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Mail has been sent', info.response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

export const signup = async (req, res) => {
  try {
    usersDetails.findOne({ email: req.body.email }, (err, isEmail) => {
      if (isEmail) {
        return res
          .status(400)
          .json({ message: 'User with this email already exists' });
      }

      let token_activate = jwt.sign(
        { name: req.body.firstname, email: req.body.email },
        process.env.SECRET_TOKEN,
        {
          expiresIn: '15m',
        }
      );
      accountActivateMail(req.body.firstname, req.body.email, token_activate);
      return res.status(200).json({
        message: 'Email has been sent, kindly activate your account',
      });
    });
  } catch (error) {
    res.status(500).send('Internal server error');
    console.log('something went wrong', error);
  }
};

// account activate api
export const accountActivate = (req, res) => {
  const activate_token = req.params.token;
  if (activate_token) {
    jwt.verify(activate_token, process.env.SECRET_TOKEN, (err) => {
      if (err) {
        return res.status(400).json({ message: 'The link has been expired' });
      }
      usersDetails.findOne({ email: req.body.email }, async (err, isEmail) => {
        if (isEmail) {
          return res
            .status(400)
            .json({ message: 'User with this email already exists' });
        }
        const newPassword = await securePassword(req.body.password);
        req.body.hashedPassword = newPassword;

        let user = new usersDetails(req.body);
        user.save((err, data) => {
          if (err) {
            console.log(err);
            return res
              .status(400)
              .json({ message: 'Error activating account' });
          } else {
            res
              .status(201)
              .json({ message: 'Signup Successfully', data: data });
          }
        });
      });
    });
  }
};

export const signin = async (req, res) => {
  try {
    // fetch user with email id from DB
    usersDetails.findOne({ email: req.body.email }, async (err, user) => {
      if (err || !user) {
        res.status(401).json({ message: 'Invalid Credentials' });
      } else {
        // if user given password is == user password in db
        let isPasswordMatch = await bcrypt.compare(
          req.body.password,
          user.hashedPassword
        );
        if (isPasswordMatch) {
          let token = jwt.sign(
            { name: user.firstname, id: user._id },
            process.env.SECRET_KEY
          );
          res.json({ msg: 'successfully logged in', token: token, user: user });
        } else {
          res.status(401).json({ message: 'Invalid Credentials' });
        }
      }
    });
  } catch (error) {
    res.status(500).send('Internal server error');
    console.log('something went wrong', error);
  }
};

// reset password mail
export const resetPasswordMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    var message = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'For Reset Password',
      text: 'Please click the link below and reset your password',
      html:
        '<p> Hi ' +
        name +
        ', Please click <a href="https://shortly-url-shortener-app.netlify.app/#/reset-password/' +
        token +
        '"> here </a> to reset your password.The link will be expired in 15 minutes.</p>',
    };

    transporter.sendMail(message, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Mail has been sent', info.response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

// forget password
export const forgetPassword = async (req, res) => {
  try {
    const isUserExist = await usersDetails.findOne({ email: req.body.email });
    if (isUserExist) {
      const randomString = randomstring.generate();
      let token_pass = jwt.sign(
        { name: isUserExist.firstname, id: isUserExist._id },
        randomString,
        {
          expiresIn: '15m',
        }
      );
      const data = await usersDetails.updateOne(
        { email: req.body.email },
        { $set: { token: token_pass } }
      );
      resetPasswordMail(isUserExist.firstname, isUserExist.email, token_pass);
      res.status(200).json({
        message: 'Please check your inbox of email and reset your password',
      });
    } else {
      res.status(401).json({ message: 'Invalid Credentials' });
    }
  } catch (error) {
    res.status(500).send('Internal server error');
    console.log('something went wrong', error);
  }
};

// reset password
export const resetPassword = async (req, res) => {
  try {
    if (req.body.password !== req.body.confirm_password) {
      res.status(400).json({ message: 'Passwords do not match' });
    } else {
      const token = req.params.token;
      const tokenData = await usersDetails.findOne({ token: token });
      if (tokenData) {
        const password = req.body.password;
        const newPassword = await securePassword(password);
        const userData = await usersDetails.findByIdAndUpdate(
          { _id: tokenData._id },
          { $set: { hashedPassword: newPassword, token: '' } },
          { new: true }
        );
        res.status(200).json({
          message: 'Your password reset successfully',
          data: userData,
        });
      } else {
        res.status(400).json({ message: 'This link has been expired' });
      }
    }
  } catch (error) {
    res.status(500).send('Internal server error');
    console.log('something went wrong', error);
  }
};
