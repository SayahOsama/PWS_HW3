import { IncomingMessage, ServerResponse } from "http";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { ERROR_401 } from "./const.js";
import User from "./models/users.js";
import mongoose from "mongoose";
import * as dotenv from "dotenv";

const secretKey = process.env.SECRET_KEY || "your_secret_key";

// Verify JWT token
const verifyJWT = (token: string) => {
  try {
    return jwt.verify(token, secretKey);
    // Read more here: https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
    // Read about the diffrence between jwt.verify and jwt.decode.
  } catch (err) {
    return false;
  }
};

// Middelware for all protected routes. You need to expend it, implement premissions and handle with errors.
export const protectedRout = (req: IncomingMessage, res: ServerResponse) => {
  let authHeader = req.headers["authorization"] as string;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.statusCode = 401;
    res.end(
      JSON.stringify({
        message: "Authorization header missing or invalid format.",
      })
    );
    return ERROR_401;
  }
  // authorization header needs to look like that: Bearer <JWT>.
  // So, we just take to <JWT>.
  // TODO: You need to validate it.
  let authHeaderSplited = authHeader && authHeader.split(" ");
  const token = authHeaderSplited && authHeaderSplited[1];

  if (!token) {
    res.statusCode = 401;
    res.end(
      JSON.stringify({
        message: "No token.",
      })
    );
    return ERROR_401;
  }

  // Verify JWT token
  const user = verifyJWT(token);
  if (!user) {
    res.statusCode = 401;
    res.end(
      JSON.stringify({
        message: "Failed to verify JWT.",
      })
    );
    return ERROR_401;
  }

  // We are good!
  return user;
};

export const loginRoute = (req: IncomingMessage, res: ServerResponse) => {
  // Read request body.
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    // Parse request body as JSON
    let credentials;
    try {
      credentials = JSON.parse(body);
    } catch (error) {
      res.statusCode = 400;
      res.end("Invalid JSON format in request body.");
      return;
    }

    const bodyKeys = Object.keys(credentials);
    if (!bodyKeys.includes("username") || !bodyKeys.includes("password")) {
      res.statusCode = 400;
      res.end("Request body must contain only 'username' and 'password' fields.");
      return;
    }
    if(credentials.username === "" || credentials.password === ""){
      res.statusCode = 400;
      res.end("Invalid username or password.");
      return;
    }

    // Check if username and password match
    const username = credentials.username;
    const user = await User.findOne({username});
    if (!user) {
      res.statusCode = 401;
      res.end(
        JSON.stringify({
          message: "Invalid username or password.",
        })
      );
      return;
    }

    // bcrypt.hash create single string with all the informatin of the password hash and salt.
    // Read more here: https://en.wikipedia.org/wiki/Bcrypt
    // Compare password hash & salt.
    const passwordMatch = await bcrypt.compare(
      credentials.password,
      user.password
    );
    if (!passwordMatch) {
      res.statusCode = 401;
      res.end(
        JSON.stringify({
          message: "Invalid username or password.",
        })
      );
      return;
    }

    // Create JWT token.
    // This token contain the userId in the data section.
    const token = jwt.sign({ id: user.id }, secretKey, {
      expiresIn: 86400, // expires in 24 hours
    });
    
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        token: token,
      })
    );
  });
};

export const signupRoute = (req: IncomingMessage, res: ServerResponse) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    // Parse request body as JSON
    let credentials;
    try {
      credentials = JSON.parse(body);
    } catch (error) {
      res.statusCode = 400;
      res.end("Invalid JSON format in request body.");
      return;
    }

    const bodyKeys = Object.keys(credentials);
    if (!bodyKeys.includes("username") || !bodyKeys.includes("password")) {
      res.statusCode = 400;
      res.end("Request body must contain only 'username' and 'password' fields.");
      return;
    }

    const username = credentials.username;
    const password = await bcrypt.hash(credentials.password, 10);
    if(username.length == 0){
      res.statusCode = 400;
      res.end("Invalid username");
      return;
    }

    if(credentials.password.length == 0){
      res.statusCode = 400;
      res.end("Invalid password");
      return;
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.statusCode = 400;
      res.end("Username already exists");
      return;
    }

    // Create a new user document
    const newUser = new User({
      username: username,
      password: password,
      permission: "W"
    });

    // Save the user to the database
    await newUser.save();

    res.statusCode = 201; // Created a new user!
    res.end(
      JSON.stringify({
        username,
      })
    );
  });
};
