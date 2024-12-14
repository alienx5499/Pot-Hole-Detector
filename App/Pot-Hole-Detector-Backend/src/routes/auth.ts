import { Router, Request, Response } from "express";
const authRouter = Router();
import { z } from "zod";
import { UserModel } from "../models";
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config";
import { ReportModel } from "../models";
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
    if (!successSchema.success) {
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
      token: token,
      user: {
        name: user.name,
        email: user.email,
        isGuest: false
      }
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
    if (!successSchema.success) {
      res.status(400).json({
        success: false,
        message: "Please enter correct body structure",
      });
      return;
    }

    const user = await UserModel.findOne({
      email: email,
    });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User does not exist",
      });
      return;
    }

    const passwordVerify = await bcrypt.compare(
      password,
      user.passwordHash
    );
    if (!passwordVerify) {
      res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
      return;
    }

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

    res.json({
      success: true,
      message: "User signed in successfully",
      token: token,
      user: {
        name: user.name,
        email: user.email,
        isGuest: false
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
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
        email: guestUser.email,
        isGuest: true
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
authRouter.get("/profile", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: "No authorization token provided"
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string };
    const user = await UserModel.findById(decoded.userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }

    // Get report count for level calculation
    const reportCount = await ReportModel.countDocuments({ userId: user._id });

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture || 'https://imgs.search.brave.com/uLARhH16ug7xgUl3msl3yHs0DCWkofOAnLVeWQ-poy0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/a2luZHBuZy5jb20v/cGljYy9tLzI1Mi0y/NTI0Njk1X2R1bW15/LXByb2ZpbGUtaW1h/Z2UtanBnLWhkLXBu/Zy1kb3dubG9hZC5w/bmc',
        reports: reportCount,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
});
authRouter.put("/profile", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: "No authorization token provided"
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string };
    const user = await UserModel.findById(decoded.userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }

    const { name, email, phone, profilePicture } = req.body;

    // Check if email is being changed and if it's already in use
    if (email !== user.email) {
      const existingUser = await UserModel.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: "Email already in use"
        });
        return;
      }
    }

    // Update user profile
    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          name: name || user.name,
          email: email || user.email,
          phone: phone || user.phone,
          profilePicture: profilePicture || user.profilePicture
        }
      }
    );

    res.json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
});
export default authRouter;
