import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();


// =====================================
// SIGNUP
// =====================================

router.post("/signup", async (req, res) => {

  try {

    const {
      fullName,
      email,
      password
    } = req.body;


    // Validation

    if (!fullName || !email || !password) {

      return res.status(400).json({
        message: "All fields are required"
      });

    }


    if (password.length < 6) {

      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });

    }


    // Check existing user

    const existingUser = await User.findOne({
      email: email.toLowerCase()
    });


    if (existingUser) {

      return res.status(400).json({
        message: "User already exists"
      });

    }


    // Hash password

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );


    // Create user

    const user = await User.create({

      fullName,

      email: email.toLowerCase(),

      password: hashedPassword

    });


    // Create JWT

    const token = jwt.sign(

      {
        userId: user._id,
        email: user.email
      },

      process.env.JWT_SECRET

    );


    // Send response

    res.status(201).json({

      message: "Signup successful",

      token,

      user: {

        id: user._id,

        fullName: user.fullName,

        email: user.email

      }

    });


  } catch (error) {

    console.error(
      "SIGNUP ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });

  }

});


export default router;