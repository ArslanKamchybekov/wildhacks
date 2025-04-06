from flask import Flask, request, jsonify
import cv2
import time
import threading
import datetime
import requests
import sys
import os

# Import your detector classes
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from emotion_detector import EmotionDetector
from focus_detector import SimpleFocusDetector
from gesture_detector import GestureDetector

app = Flask(__name__)

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
    "user_email": "arslankamcybekov7@gmail.com"
}

# Detection thread function
def run_detectors():
    print("Starting vision detection thread...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Error: Cannot access webcam.")
        return

    # Initialize all detector modules
    focus_detector = SimpleFocusDetector()
    emotion_detector = EmotionDetector()
    gesture_detector = GestureDetector()
    
    # Previous states
    last_emotion = {"emotion": "Neutral", "confidence": 0.7}
    last_focus = {"is_focused": True}
    last_gesture = {"gesture": "No Hand", "confidence": 0.0}
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Failed to grab frame")
                time.sleep(0.1)
                continue

            frame = cv2.flip(frame, 1)  # Mirror image for natural interaction

            # Process with focus detector
            frame, focus_state = focus_detector.process_frame(frame)
            if focus_state != last_focus:
                last_focus = focus_state
                
            # Get emotion update
            emotion_state = emotion_detector.detect_emotion(frame)
            if emotion_state != last_emotion:
                last_emotion = emotion_state
            
            # Get gesture update
            gesture_state = gesture_detector.detect_gesture(frame)
            if gesture_state != last_gesture:
                last_gesture = gesture_state

            # Update the global data structure
            global latest_data
            
            latest_data = {
                "emotion": last_emotion["emotion"].lower(),
                "focus": "focused" if last_focus["is_focused"] else "distracted",
                "thumbs_up": "detected" if last_gesture["gesture"] == "Thumbs Up" else "not_detected",
                "wave": "detected" if last_gesture["gesture"] == "Wave" else "not_detected",
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "user_email": "arslankamcybekov7@gmail.com"
            }
            
            # Optional: Display debug window
            # Uncomment to see video feed with detections
            # cv2.imshow("Vision Processing", frame)
            # if cv2.waitKey(1) & 0xFF == ord('q'):
            #     break
    
    except Exception as e:
        print(f"❌ Error in detection thread: {e}")
    finally:
        # Clean up resources
        try:
            focus_detector.release()
            emotion_detector.release()
            gesture_detector.release()
            cap.release()
            cv2.destroyAllWindows()
        except:
            pass
        print("Vision detection thread stopped")

# Data sender function (runs in separate thread)
def send_data_thread():
    print(f"Starting data sender thread, posting to {REMOTE_SERVER_URL}")
    last_sent_data = None
    
    while True:
        try:
            # Only send if data has changed
            if latest_data != last_sent_data:
                response = requests.post(REMOTE_SERVER_URL, json=latest_data)
                if response.status_code == 200:
                    print(f"✅ Data sent: {latest_data}")
                    last_sent_data = latest_data.copy()
                else:
                    print(f"❌ Failed to send data: {response.status_code}")
        except Exception as e:
            print(f"❌ Error sending data: {e}")
        
        time.sleep(DATA_SEND_INTERVAL)

# Local API endpoint to get current detection state
@app.route('/api/state', methods=['GET'])
def get_detection_state():
    return jsonify(latest_data)

# Endpoint to manually send the current state
@app.route('/api/send', methods=['POST'])
def send_current_state():
    try:
        response = requests.post(REMOTE_SERVER_URL, json=latest_data)
        return jsonify({
            "status": "success", 
            "sent_data": latest_data,
            "response_code": response.status_code
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    # Start vision detection in a background thread
    detection_thread = threading.Thread(target=run_detectors)
    detection_thread.daemon = True
    detection_thread.start()
    
    # Start data sender in a background thread
    sender_thread = threading.Thread(target=send_data_thread)
    sender_thread.daemon = True
    sender_thread.start()
    
    # Start Flask server
    print("🚀 Starting Vision Server on http://localhost:8000")
    app.run(host='0.0.0.0', port=8000, debug=False)