import sys
import time
import threading
import datetime
import requests
import cv2
from flask import Flask, jsonify, render_template, request, redirect, url_for, session
import os

# Import your detector classes
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from emotion_detector import EmotionDetector
from focus_detector import SimpleFocusDetector
from gesture_detector import GestureDetector

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# Configuration
DATA_SEND_INTERVAL = 1  # Seconds between data sends
REMOTE_SERVER_URL = "http://localhost:3000/api/cv-event"  # Your remote endpoint

# Store the latest detection results
latest_data = {
    "emotion": "neutral",
    "focus": "focused",
    "thumbs_up": "not_detected",
    "wave": "not_detected",
    "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    "user_email": "",  # Will be set from login
    "current_tab_url": ""
}

# Detection and data sender threads
detection_thread = None
sender_thread = None
stop_threads = False

# Detection thread function
def run_detectors():
    global latest_data, stop_threads
    
    # Initialize detectors
    emotion_detector = EmotionDetector()
    focus_detector = SimpleFocusDetector()
    gesture_detector = GestureDetector()
    
    print("Starting vision detection thread...")
    
    # Initialize webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Error: Cannot access webcam.")
        return
        
    while not stop_threads:
        try:
            ret, frame = cap.read()
            if not ret:
                print("❌ Failed to grab frame")
                time.sleep(0.1)
                continue

            frame = cv2.flip(frame, 1)  # Mirror image for natural interaction
            
            # Process with focus detector
            frame, focus_state = focus_detector.process_frame(frame)
            latest_data["focus"] = "focused" if focus_state["is_focused"] else "distracted"
            
            # Get emotion update
            emotion_state = emotion_detector.detect_emotion(frame)
            latest_data["emotion"] = emotion_state["emotion"].lower()
            
            # Get gesture update
            gesture_state = gesture_detector.detect_gesture(frame)
            
            # Update gestures in latest_data
            latest_data["thumbs_up"] = "detected" if gesture_state["gesture"] == "Thumbs Up" else "not_detected"
            latest_data["wave"] = "detected" if gesture_state["gesture"] == "Wave" else "not_detected"
            
            # Update timestamp
            latest_data["timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
            
            time.sleep(0.1)  # Small sleep to prevent CPU overuse
        except Exception as e:
            print(f"Error in detection thread: {e}")
            time.sleep(1)  # Sleep longer on error

# Data sender thread function
def send_data():
    global latest_data, stop_threads
    
    print(f"Starting data sender thread, posting to {REMOTE_SERVER_URL}")
    
    while not stop_threads:
        try:
            # Send data to the remote server
            response = requests.post(REMOTE_SERVER_URL, json=latest_data)
            if response.status_code != 200:
                print(f"❌ Failed to send data: {response.status_code}")
            time.sleep(DATA_SEND_INTERVAL)
        except Exception as e:
            print(f"Error sending data: {e}")
            time.sleep(DATA_SEND_INTERVAL)

# Routes
@app.route('/')
def index():
    if 'user_email' in session:
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    global latest_data, detection_thread, sender_thread, stop_threads
    
    if request.method == 'POST':
        email = request.form.get('email')
        if not email or '@' not in email:
            return render_template('login.html', error='Please enter a valid email address')
        
        # Store email in session and latest_data
        session['user_email'] = email
        latest_data["user_email"] = email
        
        # Start threads if they're not already running
        if detection_thread is None or not detection_thread.is_alive():
            stop_threads = False
            detection_thread = threading.Thread(target=run_detectors)
            detection_thread.daemon = True
            detection_thread.start()
        
        if sender_thread is None or not sender_thread.is_alive():
            sender_thread = threading.Thread(target=send_data)
            sender_thread.daemon = True
            sender_thread.start()
        
        return redirect(url_for('dashboard'))
    
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_email' not in session:
        return redirect(url_for('index'))
    
    return render_template('dashboard.html', user_email=session['user_email'])

@app.route('/logout')
def logout():
    global stop_threads
    
    # Clear session
    session.pop('user_email', None)
    
    # Signal threads to stop
    stop_threads = True
    
    return redirect(url_for('index'))

@app.route('/api/state')
def get_state():
    return jsonify(latest_data)

if __name__ == '__main__':
    print("🚀 Starting Vision Server on http://localhost:8000")
    app.run(host='0.0.0.0', port=8000)