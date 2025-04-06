import cv2
import numpy as np
import time
from deepface import DeepFace
from collections import deque
import mediapipe as mp

class EmotionDetector:
    def __init__(self):
        self.mp_face_detection = mp.solutions.face_detection
        self.face_detection = self.mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)
        self.last_face_position = None
        self.last_processed_time = 0
        self.process_interval = 0.4
        self.last_emotion = {"emotion": "Neutral", "confidence": 0.7}
        self.emotion_history = deque(maxlen=3)  # Shorter history for more responsiveness
        self.debug = True
        print("[EmotionDetector] Initialized with DeepFace backend")

    def detect_emotion(self, frame):
        current_time = time.time()
        process_now = current_time - self.last_processed_time >= self.process_interval
        
        # Always track faces with MediaPipe in every frame
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_detection.process(frame_rgb)

        if results.detections:
            detection = results.detections[0]
            h, w, _ = frame.shape
            bbox = detection.location_data.relative_bounding_box
            x = max(0, int(bbox.xmin * w))
            y = max(0, int(bbox.ymin * h))
            width = min(int(bbox.width * w), w - x)
            height = min(int(bbox.height * h), h - y)
            self.last_face_position = (x, y, width, height)
        
        # Process emotion only at the specified interval
        if process_now and self.last_face_position:
            self.last_processed_time = current_time
            x, y, width, height = self.last_face_position
            face_img = frame[y:y+height, x:x+width]
            
            if face_img.size == 0:
                # Still draw the previous emotion box
                if self.debug and self.last_emotion.get("face_position"):
                    x, y, width, height = self.last_emotion["face_position"]
                    self._draw_emotion_box(frame, x, y, width, height, 
                                          self.last_emotion["emotion"], 
                                          self.last_emotion["confidence"])
                return self.last_emotion

            try:
                result = DeepFace.analyze(face_img, actions=["emotion"], enforce_detection=False, silent=True)
                emotion_data = result[0] if isinstance(result, list) else result
                
                # Get raw emotion scores
                raw_emotions = emotion_data['emotion']
                if self.debug:
                    print(f"[DEBUG] Raw emotion scores: {raw_emotions}")
                
                # Get the three emotions we care about
                happy_score = raw_emotions.get("happy", 0) 
                sad_score = raw_emotions.get("sad", 0)
                neutral_score = raw_emotions.get("neutral", 0)
                
                # SIMPLE MOUTH-BASED DETECTION
                # Boost happy for smiles
                if happy_score > 30:  # Even moderate smiles
                    happy_score *= 2.0
                    
                # Increase sad sensitivity (less dampening)
                sad_score *= 0.7  # Was 0.4, now more sensitive
                
                # Slightly reduce neutral to make emotions more detectable
                neutral_score *= 0.9
                
                # Calculate normalized scores
                total = happy_score + sad_score + neutral_score
                if total > 0:
                    happy_norm = happy_score / total
                    sad_norm = sad_score / total
                    neutral_norm = neutral_score / total
                else:
                    happy_norm = sad_norm = neutral_norm = 1/3
                
                # Simple decision logic
                if happy_norm > 0.5:  # Clear happiness
                    dominant_emotion = "Happy"
                    confidence = happy_norm
                elif sad_norm > 0.4:  # More sensitive to sadness
                    dominant_emotion = "Sad"
                    confidence = sad_norm
                else:
                    dominant_emotion = "Neutral"
                    confidence = neutral_norm
                
                # Add to history
                self.emotion_history.append(dominant_emotion)
                
                if self.debug:
                    print(f"[DEBUG] Emotion history: {list(self.emotion_history)}")
                
                # Very simple stability - just need 2 consecutive detections
                if len(self.emotion_history) >= 2:
                    last_two = list(self.emotion_history)[-2:]
                    if last_two[0] == last_two[1]:  # Two consecutive same emotions
                        final_emotion = last_two[0]
                    else:
                        # Stick with current emotion unless we've detected something different
                        # for the past two frames
                        final_emotion = self.last_emotion["emotion"]
                        
                        # Special case: if previously Neutral and now detecting emotions, be responsive
                        if final_emotion == "Neutral" and dominant_emotion != "Neutral":
                            final_emotion = dominant_emotion
                else:
                    final_emotion = dominant_emotion

                self.last_emotion = {
                    "emotion": final_emotion,
                    "confidence": confidence,
                    "face_position": self.last_face_position
                }

            except Exception as e:
                print(f"[EmotionDetector] DeepFace error: {e}")
        
        # Always draw the emotion box in every frame, even if we didn't process a new emotion
        if self.debug and self.last_face_position and self.last_emotion:
            # Use the current face position with the last detected emotion
            x, y, width, height = self.last_face_position
            self._draw_emotion_box(frame, x, y, width, height, 
                                  self.last_emotion["emotion"], 
                                  self.last_emotion["confidence"])

        return self.last_emotion

    def _draw_emotion_box(self, frame, x, y, w, h, emotion, confidence):
        colors = {
            "Happy": (0, 255, 0),  # Green
            "Sad": (255, 0, 0),    # Blue (BGR format)
            "Neutral": (255, 255, 255)  # White
        }
        color = colors.get(emotion, (255, 255, 255))
        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
        label = f"{emotion}: {confidence:.2f}"
        cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    def release(self):
        self.face_detection.close()