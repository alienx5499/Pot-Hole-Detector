
<div align="center">

# 🌟 **Pot Hole Detector** 🌟  
### *Empowering citizens to report potholes and raise awareness*

![Build Passing](https://img.shields.io/badge/build-passing-success?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-v16.10.0-green?style=flat-square)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat-square)](https://github.com/alienx5499/Pot-Hole-Detector/blob/main/CONTRIBUTING.md)
[![License: MIT](https://custom-icon-badges.herokuapp.com/github/license/alienx5499/Pot-Hole-Detector?logo=law&logoColor=white)](https://github.com/alienx5499/Pot-Hole-Detector/blob/main/LICENSE)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-brightgreen?style=flat-square)
![Twitter Integration](https://img.shields.io/badge/social%20media-Twitter-blue?style=flat-square)
![Views](https://hits.dwyl.com/alienx5499/Pot-Hole-Detector.svg)
![⭐ GitHub stars](https://img.shields.io/github/stars/alienx5499/Pot-Hole-Detector?style=social)
![🍴 GitHub forks](https://img.shields.io/github/forks/alienx5499/Pot-Hole-Detector?style=social)
![Commits](https://badgen.net/github/commits/alienx5499/Pot-Hole-Detector)
![🐛 GitHub issues](https://img.shields.io/github/issues/alienx5499/Pot-Hole-Detector)
![📂 GitHub pull requests](https://img.shields.io/github/issues-pr/alienx5499/Pot-Hole-Detector)
![💾 GitHub code size](https://img.shields.io/github/languages/code-size/alienx5499/Pot-Hole-Detector)

</div>

---

## **📱 What is Pot Hole Detector?**

The **Pot Hole Detector** is a web application built using **Node.js** that enables users to:
- Capture and report potholes with precise location tagging.
- Automatically share pothole information on **Twitter** to raise awareness.
- Keep track of reported potholes in a user-friendly dashboard.

> *"Drive change by reporting potholes to ensure safer roads for everyone!"*

---

## **📚 Table of Contents**
1. [✨ Features](#-features)
2. [🛠️ Tech Stack](#️-tech-stack)
3. [📸 Screenshots](#-screenshots)
4. [⚙️ Setup Instructions](#️-setup-instructions)
5. [🚨 Resource Warning](#-resource-warning)
6. [🎯 Target Audience](#-target-audience)
7. [🤝 Contributing](#-contributing)
8. [🌟 Awesome Contributors](#-awesome-contributors)
9. [📜 License](#-license)

---

## **✨ Features**  

### **Image Capture**
- Capture clear images of potholes through user uploads.
- **Image Clarity Verification**: Prompt users for a re-upload if the image is blurry or unclear.

### **Location Tagging**
- **GPS Auto-Tagging**: Automatically fetch and tag the pothole's GPS coordinates.
- **Address Conversion**: Convert coordinates into readable addresses using a geolocation API (e.g., Google Maps).
- **Manual Location Input**: Allow users to input location manually if permissions are denied.

### **Social Media Integration (Twitter)**
- Automatically create a **Twitter post** with:
  - The pothole image.
  - The location (GPS coordinates or address).
  - A warning message to alert authorities.
- Users can customize warning messages.

### **User Dashboard**
- View the history of reported potholes.
- Track the status of each report (e.g., pending, acknowledged, resolved).

---

## **🛠️ Tech Stack**

### 🌐 **Backend Technologies**
- **Backend Framework**: Node.js with Express.js
- **Database**: MongoDB
- **Image Storage**: Cloudinary or Amazon S3
- **Geolocation**: Google Maps API for GPS and address lookup
- **Social Media Integration**: Twitter API for posting

### **Frontend Framework**
- React.js or any preferred frontend framework for building the dashboard and user interface.

---

## **📸 Screenshots**
<div align="center">

<table>
<tr>
  <td><img src="https://github.com/user-attachments/assets/bdbed1b4-8f6d-4bed-9eb4-ce4f147864b9" alt="Login Screen" width="250px"></td>
  <td><img src="https://github.com/user-attachments/assets/dc1ef52c-ccd9-4e8f-a7a3-1b37c1d4ea9e" alt="Splash Screen" width="250px"></td>
  <td><img src="https://github.com/user-attachments/assets/c0f6feec-d484-4acc-ac4e-60fbf6b82e18" alt="Home Screen" width="250px"></td>
</tr>
<tr>
  <td><b>Login Screen</b></td>
  <td><b>Splash Screen</b></td>
  <td><b>Home Screen</b></td>
</tr>
<tr>
  <td><img src="https://github.com/user-attachments/assets/69b7212d-ed57-4e2f-8843-47da87991673" alt="Camera Screen" width="250px"></td>
  <td><img src="https://github.com/user-attachments/assets/7ec49fe0-4e64-4cde-a284-b707ccd8404c" alt="Map Screen" width="250px"></td>
  <td><img src="https://github.com/user-attachments/assets/07c5766c-b778-4544-9fb0-ad1542c6f038" alt="Dashboard Screen" width="250px"></td>
</tr>
<tr>
  <td><b>Camera Screen</b></td>
  <td><b>Map Screen</b></td>
  <td><b>Dashboard Screen</b></td>
</tr>
</table>

</div>

---

## **⚙️ Setup Instructions**

### **Frontend Setup**
- **Prerequisites**
  - **Node.js** (v16.10.0 or higher)
  - **Expo CLI**: Install globally using `npm install -g expo-cli`
  - **Git**: For version control
  - **API Keys**:
    - **Google Maps API**: For geolocation and address lookup
    - **Twitter API**: For posting reports
    - **Cloudinary/Amazon S3**: For image storage

1. **Clone the Repository**
   ```bash
   git clone https://github.com/alienx5499/Pot-Hole-Detector.git
   ```
2. **Navigate to the Project Directory**
   ```bash
   cd Pot-Hole-Detector
   ```
3. **Install Dependencies**
   ```bash
   npm install
   ```
4. **Set Up APIs**
   - Obtain API keys for:
     - **Google Maps API** (geolocation and address lookup).
     - **Twitter API** (posting reports).
   - Add these keys to a `.env` file:
     ```plaintext
     GOOGLE_MAPS_API_KEY=your_google_maps_api_key
     TWITTER_API_KEY=your_twitter_api_key
     TWITTER_API_SECRET=your_twitter_api_secret
     ```

5. **Configure Expo**
   Ensure that your app.json or app.config.js is set up correctly with necessary permissions for location and camera access.

6. **Run the Application**
   ```bash
   expo start
   ```
   - **For iOS:** Press i to open in the iOS simulator.
   - **For Android:** Press a to open in the Android emulator.
   - **On Physical Devices:** Use the Expo Go app to scan the QR code.

7. **Build for Production**
   Use Expo’s build service to create standalone builds:
   ```bash
   expo build:android
   expo build:ios
   ```

8. **Deployment**
   Deploy the backend server using platforms like Heroku, AWS, or DigitalOcean. For the mobile app, publish to Google Play Store and Apple App Store.

### **Backend Setup**
- **Prerequisites**
  - Node.js v16.10.0 or higher
  - MongoDB v4.4 or higher
  - NPM or Yarn package manager
  - At least 1GB of free disk space
  - Active internet connection for API integrations

1. **Navigate to Backend Directory**  
   ```bash
   cd Pot-Hole-Detector-Backend
   ```

2. **Install Dependencies**  
   ```bash
   npm install
   ```

3. **Environment Configuration**  
   - Create a `.env` file in the backend root directory  
   - Copy contents from `.env.example` and fill in your values:  
     ```plaintext
     MONGO_URL=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret_key
     ```

4. **Database Setup**  
   - Ensure MongoDB is installed and running  
   - Create a new MongoDB database  
   - Add the connection string to your `.env` file

5. **Create Upload Directory**  
   ```bash
   mkdir uploads
   ```

6. **Start Development Server**  
   ```bash
   npm run dev
   ```

7. **Verify Installation**
   - The server should be running on `http://localhost:3000`
   - Test the endpoints:
     - **Auth**: `POST http://localhost:3000/api/v1/auth/signup`
     - **Pothole**: `POST http://localhost:3000/api/v1/pothole/upload`

---

## **🕸️ API Endpoints**

1. **Authentication**  
   - Register new user `POST /api/v1/auth/signup`
   - Login existing user `POST /api/v1/auth/signin`
   - Login as guest `POST /api/v1/auth/guest-signin` 
   - Convert guest to regular user `POST /api/v1/auth/convert-guest` 

1. **Pothole Reports**  
   - Upload new pothole report `POST /api/v1/pothole/upload`
   - Get user dashboard data `GET /api/v1/pothole/dashboard` 
   - Get recent reports `GET /api/v1/pothole/recent-reports`
   - Get specific report details `GET /api/v1/pothole/report/:id`

---

## **🚨 Resource Warning**

This project involves API calls and real-time geolocation processing, which may consume significant server resources. If your server has limited capabilities, ensure:
- Efficient caching mechanisms for frequently used API responses.
- Testing with smaller datasets during the development phase.

Alternatively, use mock data during initial development to simulate production behavior.

---

## **🎯 Target Audience**

1. **Commuters**: Easily report road hazards and improve safety.
2. **Local Authorities**: Gain better insights into road conditions.
3. **Activists and Environmentalists**: Leverage social media to raise awareness about infrastructure issues.
4. **Developers**: Expand the repository with new features or APIs.

---

## **🤝 Contributing**

We ❤️ open source! Contributions are welcome to make this project even better.  

1. Fork the repository.  
2. Create your feature branch.  
   ```bash
   git checkout -b feature/new-feature
   ```
3. Commit your changes.  
   ```bash
   git commit -m "Add a new feature"
   ```
4. Push to the branch and open a pull request.

---

## <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f31f/512.webp" width="35" height="30"> Awesome Contributors

<div align="center">
	<h3>Thank you for contributing to our repository</h3><br>
	<p align="center">
		<a href="https://github.com/alienx5499/Pot-Hole-Detector/contributors">
			<img src="https://contrib.rocks/image?repo=alienx5499/Pot-Hole-Detector" width="90" height="45" />
		</a>
	</p>
</div>

---

## **📜 License**

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

### 📬 **Feedback & Suggestions**
*We value your input! Share your thoughts through [GitHub Issues](https://github.com/alienx5499/Pot-Hole-Detector/issues).*

💡 *Let's work together to improve road safety and awareness!*

</div>
