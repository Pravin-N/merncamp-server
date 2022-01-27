import User from "../models/user";
import { hashPassword, comparePassword } from "../helpers/auth";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  //   console.log("Register Endpoint =>", req.body);
  const { name, email, password, secret } = req.body;
  //   validation
  if (!name) {
    return res.json({
      error: 'Name is required'
    })
  }
  if (!email) {
    return res.json({
      error: 'Email is required'
    })
   }
  if (!password || password.length < 6)
  {
    return res.json({
      error: 'Password is required and should be atleast 6 characters long'
    })
   } 
  if (!secret) {
    return res.json({
      error: 'Answer is required'
    })
   } 
  const exist = await User.findOne({ email });
  if (exist) {
    return res.json({
      error: 'Email already in use'
    })
   } 
  //   hash password
  const hashedPassword = await hashPassword(password);

  const user = new User({ name, email, password: hashedPassword, secret });
  try {
    await user.save();
    // console.log("Regsitered User => ", user);
    return res.json({
      ok: true,
    });
  } catch (err) {
    console.log("Registration Failed => ", err);
      return res.status(400).send('Error, Try Again')
  }
};

export const login = async (req, res) => {
  // generate jwt
  // console.log(req.body);
  try {
    const { email, password } = req.body;
    // check if db has user with that email
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        error: 'No user found'
      })
     }
    // check password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.json({
        error: 'Wrong password'
      })
     }
    // create signed token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",  // 20* 60 seconds
    });
    user.password = undefined;
    user.secret = undefined;
    res.json({ token, user });
  } catch (err) {
    console.log(err);
    return res.status(400).send('Error, Try Again')
  }
};

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    // res.json(user);
    res.json({ ok: true });
  } catch (err) {
    // console.log(err);
    res.sendStatus(400);
  }
};

export const forgotPassword = async (req, res) => {
  console.log(req.body)
  const { email, newPassword, secret } = req.body
  // validation
  if (!newPassword || !newPassword > 6 ) {
    return res.json({
      error: 'New Password is required and should be min 6 characters long'
    })

  }
  if(!secret) {
    return res.json({
      error: 'Secret is required'
    })
  }
  const user = await User.findOne({email, secret});
  if(!user) {
    return res.json({
      error: 'We cant verify you with those details',
    })
  }
  try {
    const hashed = await hashPassword(newPassword);
    await User.findByIdAndUpdate(user._id, {password: hashed});
    return res.json({
      success: 'Congrats, Now you can login with your new password'
    })
  } catch (err) {
    console.log(err)
    return res.json({
      error: 'Something wrong try again'
    })
  }
}