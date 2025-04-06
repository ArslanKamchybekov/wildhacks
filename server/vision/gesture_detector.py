import cv2
import mediapipe as mp
import numpy as np
import time
from collections import deque

class GestureDetector:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        self.hands = self.mp_hands.Hands(
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        
        self.previous_x = deque(maxlen=12)
        self.direction_changes = 0
        self.last_direction = None
        self.wave_threshold = 0.05
        self.direction_threshold = 3
        
        self.last_processed_time = 0
        self.process_interval = 0.05
        
        self.last_gesture = {"gesture": "No Hand", "confidence": 0.0}
        self.gesture_hold_time = 1.0
        self.last_detection_time = 0
        
        self.debug = True
    
    def detect_gesture(self, frame):
        current_time = time.time()
        
        if current_time - self.last_detection_time < self.gesture_hold_time and self.last_gesture["gesture"] in ["Wave", "Thumbs Up", "Peace"]:
            if self.debug:
                self._draw_debug_info(frame, self.last_gesture)
            return self.last_gesture
        
        if current_time - self.last_processed_time < self.process_interval:
            return self.last_gesture
        
        self.last_processed_time = current_time
        
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb)
        
        if not results.multi_hand_landmarks:
            self.previous_x.clear()
            self.direction_changes = 0
            self.last_direction = None
            self.last_gesture = {"gesture": "No Hand", "confidence": 0.0}
            return self.last_gesture
        
        hand_landmarks = results.multi_hand_landmarks[0]
        if self.debug:
            self._draw_landmarks(frame, hand_landmarks)
        
        gesture_result = self._recognize_gesture(hand_landmarks, frame.shape[1], frame.shape[0])
        
        if gesture_result["gesture"] in ["Wave", "Thumbs Up", "Peace"]:
            self.last_detection_time = current_time
        
        self.last_gesture = gesture_result
        
        if self.debug:
            self._draw_debug_info(frame, gesture_result)
        
        return gesture_result
    
    def _recognize_gesture(self, landmarks, width, height):
        wrist = landmarks.landmark[self.mp_hands.HandLandmark.WRIST]
        thumb_tip = landmarks.landmark[self.mp_hands.HandLandmark.THUMB_TIP]
        index_tip = landmarks.landmark[self.mp_hands.HandLandmark.INDEX_FINGER_TIP]
        middle_tip = landmarks.landmark[self.mp_hands.HandLandmark.MIDDLE_FINGER_TIP]
        ring_tip = landmarks.landmark[self.mp_hands.HandLandmark.RING_FINGER_TIP]
        pinky_tip = landmarks.landmark[self.mp_hands.HandLandmark.PINKY_TIP]
        
        self.previous_x.append(wrist.x)
        
        fingers_extended = self._count_extended_fingers(landmarks)
        
        if fingers_extended == 1 and thumb_tip.y < wrist.y:
            return {"gesture": "Thumbs Up", "confidence": 0.9}
        
        if fingers_extended == 2 and index_tip.y < wrist.y and middle_tip.y < wrist.y:
            if abs(index_tip.x - middle_tip.x) > 0.03:
                return {"gesture": "Peace", "confidence": 0.9}
        
        if len(self.previous_x) == self.previous_x.maxlen and fingers_extended >= 4:
            for i in range(1, len(self.previous_x)):
                current_direction = 1 if self.previous_x[i] > self.previous_x[i-1] else -1
                if self.last_direction is not None and current_direction != self.last_direction:
                    self.direction_changes += 1
                self.last_direction = current_direction
            
            total_movement = max(self.previous_x) - min(self.previous_x)
            
            if total_movement > self.wave_threshold and self.direction_changes >= self.direction_threshold:
                confidence = min(1.0, (total_movement / self.wave_threshold) * 0.5 + (self.direction_changes / self.direction_threshold) * 0.5)
                self.direction_changes = 0
                return {"gesture": "Wave", "confidence": round(confidence, 2)}
        
        return {"gesture": "Hand Detected", "confidence": 1.0}
    
    def _count_extended_fingers(self, landmarks):
        tips = [
            (self.mp_hands.HandLandmark.THUMB_TIP, self.mp_hands.HandLandmark.THUMB_IP),
            (self.mp_hands.HandLandmark.INDEX_FINGER_TIP, self.mp_hands.HandLandmark.INDEX_FINGER_PIP),
            (self.mp_hands.HandLandmark.MIDDLE_FINGER_TIP, self.mp_hands.HandLandmark.MIDDLE_FINGER_PIP),
            (self.mp_hands.HandLandmark.RING_FINGER_TIP, self.mp_hands.HandLandmark.RING_FINGER_PIP),
            (self.mp_hands.HandLandmark.PINKY_TIP, self.mp_hands.HandLandmark.PINKY_PIP)
        ]
        
        extended_count = 0
        for tip_idx, pip_idx in tips:
            if landmarks.landmark[tip_idx].y < landmarks.landmark[pip_idx].y:
                extended_count += 1
        
        return extended_count
    
    def _draw_landmarks(self, frame, hand_landmarks):
        self.mp_drawing.draw_landmarks(
            frame,
            hand_landmarks,
            self.mp_hands.HAND_CONNECTIONS,
            self.mp_drawing_styles.get_default_hand_landmarks_style(),
            self.mp_drawing_styles.get_default_hand_connections_style()
        )
    
    def _draw_debug_info(self, frame, gesture_result):
        h, w = frame.shape[:2]
        
        if gesture_result["gesture"] == "Wave":
            color = (0, 255, 255)
        elif gesture_result["gesture"] == "Thumbs Up":
            color = (0, 255, 0)
        elif gesture_result["gesture"] == "Peace":
            color = (255, 0, 255)
        elif gesture_result["gesture"] == "Hand Detected":
            color = (255, 255, 255)
        else:
            color = (128, 128, 128)
        
        cv2.putText(frame, f"Gesture: {gesture_result['gesture']}", 
                   (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        
        cv2.putText(frame, f"Confidence: {gesture_result['confidence']:.2f}", 
                   (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
    
    def release(self):
        self.hands.close()