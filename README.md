# Waddl: The Ultimate Productivity App 🦆

Waddl is a real-time productivity computer vision web app with a twist—a virtual duck companion that holds you accountable (and may take your money!). It's not just a reminder to focus; it **DEMANDS** you meet your goals, blending fun, accountability, and a little bit of chaos into your daily routine.

## Inspiration

We set out to build an app that goes beyond the typical productivity reminder. Drawing inspiration from Tamagotchis, sports betting, and our playful habit of roasting each other, Waddl is the love child of our interests—quirky, intense, and designed to push you toward success (at the cost of your honor and an adorable pet).

## What It Does

- **Real-Time Productivity**: Monitor your progress through computer vision and an extension, built around a dynamic web app.
- **Virtual Duck Companion**: Bond with a cute duck via your webcam (and give it a thumbs up/wave, trust us!). If you slack off and miss your goals, **the duck dies**.
- **Shared Experience**: Raise a duck with friends and even invest money in it. Hold each other accountable.
- **Motivational Roasts**: Get encouraging—and sometimes brutally honest—roasts powered by Gemini AI (in front of everyone).

## How We Built It

Our tech stack and tools helped us bring Waddl to life:

- **Frontend**:
  - Next.js, Tailwind CSS, ShadCn, Three.js for a fast, modern, and engaging UI.
- **Backend & Authentication**:
  - MongoDB & Auth0 for a secure backend and user management.
- **Browser Monitoring**:
  - Chrome Extension API to track your activity in real time.
- **Financial Integration**:
  - Real money betting for real goal commitments with Stripe.
- **Computer Vision**:
  - OpenCV, MediaPipe, DeepFace for face, gaze, and gesture tracking along with emotion analysis.
- **Communication**:
  - Email for messaging beyond the app.
- **AI Integration**:
  - Gemini to parse natural language goals and generate custom motivational roasts.

## Getting Started

Follow these steps to clone and run the project locally:

1. **Clone the Repository**  
   Open your terminal and run:
   ```bash
   git clone https://github.com/yourusername/waddl.git
   ```
2. **Navigate to the Project Directory**
   Change your working directory to the project folder:
   ```bash
   cd waddl
   ```
3. **Install Dependencies**
   If you're using npm:
   ```bash
   npm install
   ```
   Or with yarn:
   ```bash
   yarn install
   ```
4. **Run the Development Server**
   Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Or with yarn:
   ```bash
   yarn dev
   ```
   Visit http://localhost:3000 in your browser to see the app in action.

## Challenges We Faced

- **Emotion Recognition**: Our initial computer vision model struggled with accurately reading emotions. We solved this by switching models, adjusting thresholds, and experimenting with various techniques.
- **3D Duck Model**: Finding a 3D model that was cute enough proved challenging. We tweaked and refined an existing model using Blender to match our vision.
- **Pixel Art Companion**: The available pixel art didn't capture the emotional essence we wanted. We created our own animations and pixel art from scratch to truly bring our duck to life.

## What's Next for Waddl

- **Optimize Computer Vision**: Improve efficiency to make emotion analysis less intensive.
- **Expand Social Reach**: Integrate with other platforms like Slack to broaden its reach.
- **Enhance Gameplay**: Add mini-games that help you boost your duck's health, ensuring it doesn't die.
