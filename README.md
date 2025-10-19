# 🌬️ CitizenApp - Air Quality Monitoring Platform

A comprehensive air quality monitoring application that provides real-time AQI data, personalized health recommendations, and intelligent environmental insights.

## ✨ Features

- 🌍 **Real-time Air Quality Data** - Live AQI monitoring using Google Air Quality API
- 📍 **Location-based Monitoring** - GPS-enabled location detection and city-specific data
- 👤 **User Authentication** - Secure login/signup with Firebase Authentication
- 📧 **Email Notifications** - Automated daily air quality reports via EmailJS
- 🏥 **Health Recommendations** - Personalized advice based on health conditions
- 📊 **Analytics Dashboard** - Comprehensive air quality insights and trends
- 🗺️ **Safe Routes** - Pollution-aware navigation suggestions
- 🎨 **Modern UI** - Dark theme with glass morphism design
- 📱 **Responsive Design** - Mobile-first, works on all devices

## 🚀 Tech Stack

- **Frontend**: React 18, Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **APIs**: Google Air Quality API, Google Maps API
- **Email Service**: EmailJS
- **Deployment**: Vercel-ready

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ryash14/CitizenApp.git
   cd CitizenApp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with:
   ```env
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_EMAILJS_SERVICE_ID=your_service_id
   REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id
   REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## 🌐 Deployment

This app is optimized for Vercel deployment:

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

## 📱 Key Components

- **Dashboard** - Main air quality monitoring interface
- **Settings** - User preferences and notification setup
- **Profile Setup** - Onboarding flow for new users
- **Policy Dashboard** - Administrative insights and analytics
- **Authentication** - Login/signup with Firebase

## 🎯 Core Features

### Real-time Monitoring
- Live AQI data from Google Air Quality API
- Automatic location detection
- Minute-level precision for scheduling

### Personalized Experience
- Health condition-based recommendations
- Custom AQI thresholds
- Personalized email reports

### Professional Design
- Dark theme with glass morphism
- Responsive mobile-first design
- Smooth animations and transitions

## 🔧 Configuration

### Firebase Setup
1. Create Firebase project
2. Enable Authentication (Email/Password + Google)
3. Enable Firestore Database
4. Add configuration to environment variables

### Google Cloud Setup
1. Enable Google Maps API
2. Enable Air Quality API
3. Create API key and add to environment variables

### EmailJS Setup
1. Create EmailJS account
2. Set up email service
3. Create email template
4. Add credentials to environment variables

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Ryash** - [@ryash14](https://github.com/ryash14)

---

Built with ❤️ for cleaner air and healthier communities.