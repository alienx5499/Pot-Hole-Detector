import { Router, Request, Response, NextFunction } from "express";
import { CustomRequest } from "../interfaces";
import { ReportModel, UserModel } from "../models";
import userMiddleware from "../middlewares";
import multer from "multer";
import path from "path";
import mongoose from "mongoose";
import { rwClient } from '../config/twitter';
import fs from 'fs';
import fetch from 'node-fetch';

const potholeRouter = Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/')) // Use absolute path
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'));
    }
  }
});

// Error handling middleware for multer
const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      // An unknown error occurred
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    }
    // Everything went fine
    next();
  });
};

// Updated upload route with proper error handling
potholeRouter.post('/upload', 
  userMiddleware, 
  uploadMiddleware,
  async (req: CustomRequest, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ 
              success: false, 
              message: "No image file provided" 
            });
            return;
        }

        const { latitude, longitude, address, detectionResultPercentage, shareOnTwitter } = req.body;
        if (!latitude || !longitude || !detectionResultPercentage) {
            res.status(400).json({ 
              success: false, 
              message: "Location coordinates and detection result are required" 
            });
            return;
        }

        const report = await ReportModel.create({
            userId: req.userId,
            imageUrl: req.file.path,
            location: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                address: address || ''
            },
            detectionResultPercentage: parseFloat(detectionResultPercentage)
        });

        // If user wants to share on Twitter
        if (shareOnTwitter === 'true') {
            try {
                const user = await UserModel.findById(req.userId);
                
                // Create tweet text
                const tweetText = `🚨 Pothole Alert! 📍\n
                    Reported by: ${user?.name}\n
                    Location: ${address}\n
                    Confidence: ${detectionResultPercentage}%\n
                    #PotholeAlert #RoadSafety`;

                // Upload image to Twitter
                const mediaId = await rwClient.v1.uploadMedia(req.file.path, { mimeType: 'image/jpeg' });

                // Post tweet with image
                await rwClient.v2.tweet({
                    text: tweetText,
                    media: { media_ids: [mediaId] }
                });

            } catch (twitterError) {
                console.error('Twitter posting error:', twitterError);
                // Don't fail the whole request if Twitter posting fails
            }
        }

        res.json({ success: true, report });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error uploading report"
        });
    }
});

// Modify dashboard route to show only user-specific data
potholeRouter.get('/dashboard', userMiddleware, async (req: CustomRequest, res: Response) => {
    try {
        // Get user's reports
        const reports = await ReportModel.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .lean();

        // Get user's total potholes
        const totalPotholes = await ReportModel.countDocuments({ userId: req.userId });
        
        // Get user's monthly detections for the current year
        const currentYear = new Date().getFullYear();

        const monthlyDetections = await ReportModel.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.userId)
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        // Format monthly data
        const monthlyData = new Array(12).fill(0);
        monthlyDetections.forEach(item => {
            const monthIndex = item._id - 1;
            monthlyData[monthIndex] = item.count;
        });

        // Get confidence levels distribution
        const confidenceLevels = reports.map(report => ({
            confidence: report.detectionResultPercentage,
            level: Math.floor(report.detectionResultPercentage / 10)
        }));

        // Get user details
        const user = await UserModel.findById(req.userId).select('name email');

        res.json({
            success: true,
            data: {
                user,
                reports,
                statistics: {
                    totalPotholes,
                    monthlyDetections: monthlyData,
                    userStats: {
                        totalReports: reports.length,
                        confidenceLevels,
                        firstReport: reports[reports.length - 1]?.createdAt,
                        lastReport: reports[0]?.createdAt
                    }
                }
            }
        });

    } catch (error: any) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching dashboard data",
            error: error.message
        });
    }
});

// Get recent reports for the user
potholeRouter.get('/recent-reports', userMiddleware, async (req: CustomRequest, res: Response) => {
    try {
        const reports = await ReportModel.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        res.json({
            success: true,
            data: reports
        });

    } catch (error: any) {
        console.error('Recent reports error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching recent reports",
            error: error.message
        });
    }
});

// Get report details by ID (only if it belongs to the user)
potholeRouter.get('/report/:id', userMiddleware, async (req: CustomRequest, res: Response) => {
    try {
        const report = await ReportModel.findOne({
            _id: req.params.id,
            userId: req.userId
        }).lean();

        if (!report) {
            res.status(404).json({
                success: false,
                message: "Report not found or unauthorized"
            });
            return;
        }

        res.json({
            success: true,
            data: report
        });

    } catch (error: any) {
        console.error('Report details error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching report details",
            error: error.message
        });
    }
});


potholeRouter.post('/share-twitter',
  userMiddleware,
  async (req: CustomRequest, res: Response) => {
    try {
      const { location, confidence } = req.body;
      
      const user = await UserModel.findById(req.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Creating tweet text with better formatting
      const tweetText = `🚨 Pothole Alert! 📍\nReported by: ${user.name}\nLocation: ${location}\nConfidence: ${Number(confidence).toFixed(2)}%\n#PotholeAlert #RoadSafety`;

      // Posting tweet without image for v0
      await rwClient.v2.tweet({
        text: tweetText
      });

      res.json({ 
        success: true, 
        message: 'Successfully shared on Twitter' 
      });
    } catch (error: any) {
      console.error('Share to Twitter error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error sharing to Twitter',
        error: error.message
      });
    }
  }
);

export default potholeRouter;