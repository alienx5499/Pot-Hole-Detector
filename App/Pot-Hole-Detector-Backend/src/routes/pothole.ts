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
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

const potholeRouter = Router();

// Keeping only the memory storage version
const upload = multer({ 
  storage: multer.memoryStorage(),
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

// Updating the uploadMiddleware to use the memory storage version
const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    }
    next();
  });
};

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'potholes',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url || '');
      }
    );

    // Converting buffer to Stream
    const stream = Readable.from(file.buffer);
    stream.pipe(uploadStream);
  });
};

// Updating the upload route
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

      // Uploading to Cloudinary
      const imageUrl = await uploadToCloudinary(req.file);

      const { latitude, longitude, address, detectionResultPercentage } = req.body;
      if (!latitude || !longitude || !detectionResultPercentage) {
        res.status(400).json({ 
          success: false, 
          message: "Location coordinates and detection result are required" 
        });
        return;
      }

      // Creating report with Cloudinary URL
      const report = await ReportModel.create({
        userId: req.userId,
        imageUrl: imageUrl, // Storing Cloudinary URL
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          address: address || ''
        },
        detectionResultPercentage: parseFloat(detectionResultPercentage)
      });

      res.json({ success: true, report });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Error uploading report"
      });
    }
  }
);

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
      const { imageUrl, location, confidence } = req.body;
      
      if (!imageUrl) {
        throw new Error('Image URL is required');
      }

      const user = await UserModel.findById(req.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Creating tweet text
      const tweetText = `🚨 Pothole Alert! 📍\nReported by: ${user.name}\nLocation: ${location}\nConfidence: ${Number(confidence).toFixed(2)}%\n#PotholeAlert #RoadSafety`;

      try {
        // Downloading the image from Cloudinary
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.buffer();
        
        // Saving temporarily
        const tempImagePath = path.join(__dirname, '../../uploads/temp-twitter-image.jpg');
        fs.writeFileSync(tempImagePath, imageBuffer);

        try {
          // Uploading image to Twitter
          const mediaId = await rwClient.v1.uploadMedia(tempImagePath);

          // Posting tweet with image
          await rwClient.v2.tweet({
            text: tweetText,
            media: { media_ids: [mediaId] }
          });

          // Cleaning up temp file
          fs.unlinkSync(tempImagePath);

          res.json({ 
            success: true, 
            message: 'Successfully shared on Twitter' 
          });
        } catch (twitterError: any) {
          // Cleaning up temp file in case of error
          if (fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath);
          }
          throw twitterError;
        }
      } catch (error: any) {
        console.error('Twitter posting error:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Failed to post to Twitter',
          error: error.message
        });
      }
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