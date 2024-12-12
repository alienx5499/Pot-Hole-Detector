import { Router, Request, Response } from "express";
const authRouter = Router();
import { z } from "zod";
import { UserModel } from "../models";
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config";
import bcrypt from "bcrypt";
const saltRounds = 10;
const signupSchema = z.object({
  name: z.string().max(20),
  email: z.string().email(),
  password: z.string().min(8).max(14),
});
const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(14),
});
authRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const successSchema = signupSchema.safeParse(req.body);
    if (!successSchema) {
      res.status(400).json({
        success: false,
        message: "Please enter correct body structure",
      });
      return;
    }

    const duplicateEmail = await UserModel.findOne({
      email: email,
    });
    if (duplicateEmail) {
      res.status(400).json({
        success: false,
        message: "User already exists",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);
    const user = await UserModel.create({
      name,
      email,
      passwordHash,
    });

    if (!JWT_SECRET) {
      res.status(500).json({
        success: false,
        message: "JWT secret is not defined",
      });
      return;
    }

    const token = jwt.sign({
      userId: user._id
    }, JWT_SECRET);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      token: token
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});
authRouter.post("/signin", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const successSchema = signinSchema.safeParse(req.body);
    if (!successSchema) {
      res.json({
        message: "Please enter correct body structure",
      });
      return;
    }
    const user = await UserModel.findOne({
      email: email,
    });
    if (!user) {
      res.json({
        message: "User does not exist",
      });
      return;
    }
    const passwordVerify = await bcrypt.compare(
      password,
      user.passwordHash
    );
    if (!passwordVerify) {
      res.json({
        message: "Passwords do not match",
      });
      return;
    }
    if (!JWT_SECRET) {
      res.status(500).json({
        message: "JWT secret is not defined",
      });
      return;
    }
    const token = jwt.sign({
        userId: user._id
    }, JWT_SECRET);
    res.json({
      message: "User signed in",
      token: token,
    });
  } catch (e) {
    console.log(e);
    res.json({
      message: "Internal Server Error",
    });
  }
});
authRouter.post("/guest-signin", async (req: Request, res: Response) => {
  try {
    const guestName = `Guest_${Math.random().toString(36).substring(2, 8)}`;
    const guestEmail = `${guestName.toLowerCase()}@guest.com`;
    const guestPassword = Math.random().toString(36).substring(2, 15);
    

    let guestUser = await UserModel.findOne({ email: guestEmail });
    
    if (!guestUser) {
      // Create new guest account
      const passwordHash = await bcrypt.hash(guestPassword, saltRounds);
      guestUser = await UserModel.create({
        name: guestName,
        email: guestEmail,
        passwordHash,
        isGuest: true
      });
    }

    if (!JWT_SECRET) {
      res.status(500).json({
        message: "JWT secret is not defined",
      });
      return;
    }

    const token = jwt.sign({
      userId: guestUser._id
    }, JWT_SECRET);

    res.json({
      success: true,
      message: "Guest signed in",
      token: token,
      user: {
        name: guestUser.name,
        email: guestUser.email
      }
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});
authRouter.post("/convert-guest", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: "No authorization token provided"
      });
      return;
    }

    let guestId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string };
      guestId = decoded.userId;
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Invalid token"
      });
      return;
    }

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
      return;
    }

    const guestUser = await UserModel.findOne({ _id: guestId, isGuest: true });
    if (!guestUser) {
      res.status(404).json({
        success: false,
        message: "Guest account not found"
      });
      return;
    }

    const existingUser = await UserModel.findOne({ email, isGuest: false });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "Email already in use"
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);
    await UserModel.updateOne(
      { _id: guestId },
      {
        $set: {
          name,
          email,
          passwordHash,
          isGuest: false
        }
      }
    );

    const newToken = jwt.sign({ userId: guestId }, JWT_SECRET!);

    res.json({
      success: true,
      message: "Account converted successfully",
      token: newToken
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
});
export default authRouter;