import express from "express"
import authRouter from "./routes/auth";
import potholeRouter from "./routes/pothole";
import path from "path";
import cors from "cors";

const app = express();

// Enable CORS
app.use(cors({
  origin: '*', // Be more specific in production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/pothole', potholeRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});