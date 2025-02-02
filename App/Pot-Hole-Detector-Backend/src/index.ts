import express from "express";
import authRouter from "./routes/auth";
import potholeRouter from "./routes/pothole";
import path from "path";
import cors from "cors";
import { ReportModel } from "./models";

const app = express();

// Enable CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/pothole", potholeRouter);

app.get("/", (req, res) => {
  res.send("Pot Hole Detector Backend");
});
app.get("/total-reports", async (req, res) => {
  const totalReports = await ReportModel.countDocuments();
  res.json({ totalReports });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
