import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {

    // Get Authorization header
    const authHeader =
      req.headers.authorization;


    // Check header
    if (!authHeader) {

      return res.status(401).json({
        message: "Authentication required"
      });

    }


    // Expected:
    // Bearer eyJhbGciOiJIUzI1Ni...
    const token =
      authHeader.split(" ")[1];


    if (!token) {

      return res.status(401).json({
        message: "Token missing"
      });

    }


    // Verify JWT
    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    // Store user information
    // inside request
    req.user = decoded;


    next();


  } catch (error) {

    console.error(
      "AUTH ERROR:",
      error
    );


    return res.status(401).json({
      message: "Invalid or expired token"
    });

  }
};

export default authMiddleware;