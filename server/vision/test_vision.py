import cv2
import time
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from focus_detector import SimpleFocusDetector
from emotion_detector import EmotionDetector
from gesture_detector import GestureDetector

def draw_ui(frame, fps, focus_state, emotion_state, gesture_state):
    h, w = frame.shape[:2]
    
    # Top-left focus box
    cv2.rectangle(frame, (10, 10), (280, 130), (0, 0, 0), -1)
    status_color = (0, 255, 0) if focus_state['is_focused'] else (0, 0, 255)
    status_text = "FOCUSED" if focus_state['is_focused'] else "DISTRACTED"
    cv2.putText(frame, f"Status: {status_text}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)
    cv2.putText(frame, f"Eye AR: {focus_state['eye_aspect_ratio']:.2f}", (20, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)
    cv2.putText(frame, f"Gaze Score: {focus_state['gaze_score']:.2f}", (20, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)

    # Bottom bar with Emotion (left) + Gesture (right)
    bar_height = 40
    cv2.rectangle(frame, (0, h - bar_height), (w, h), (0, 0, 0), -1)

    # Emotion left
    cv2.putText(frame,
                f"Emotion: {emotion_state['emotion']} ({emotion_state['confidence']*100:.0f}%)",
                (20, h - 12),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 255), 2)

    # Gesture right
    gesture_text = f"Gesture: {gesture_state['gesture']} ({gesture_state['confidence']*100:.0f}%)"
    gesture_size = cv2.getTextSize(gesture_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
    gesture_x = w - gesture_size[0] - 20
    cv2.putText(frame,
                gesture_text,
                (gesture_x, h - 12),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 255, 200), 2)

    # Optional FPS top-right
    cv2.putText(frame, f"FPS: {fps:.1f}", (w - 100, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (220, 220, 220), 1)

def run_all_detectors():
    print("\n🔍 Starting Focus or Die Vision Test")
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("🚨 Error: Cannot access webcam.")
        return

    focus_detector = SimpleFocusDetector()
    emotion_detector = EmotionDetector()
    gesture_detector = GestureDetector()

    print("🎥 Press 'q' to quit.")

    frame_count = 0
    start_time = time.time()
    fps = 0

    last_emotion = {"emotion": "Neutral", "confidence": 0.0}
    last_emotion_time = 0

    last_gesture = {"gesture": "No Hand", "confidence": 0.0}
    last_gesture_time = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Failed to grab frame")
                break

            frame = cv2.flip(frame, 1)

            # Process with focus detector first
            frame, focus_state = focus_detector.process_frame(frame)

            # Get emotion update if available
            current_emotion = emotion_detector.detect_emotion(frame)
            if current_emotion != last_emotion:
                last_emotion = current_emotion
                last_emotion_time = time.time()

            # Get gesture update if available
            current_gesture = gesture_detector.detect_gesture(frame)
            if current_gesture != last_gesture:
                last_gesture = current_gesture
                last_gesture_time = time.time()

            # Calculate FPS
            frame_count += 1
            elapsed_time = time.time() - start_time
            if elapsed_time >= 1.0:
                fps = frame_count / elapsed_time
                frame_count = 0
                start_time = time.time()

            # Draw all UI elements
            draw_ui(frame, fps, focus_state, last_emotion, last_gesture)

            # Text console output
            print(f"Focus: {'FOCUSED' if focus_state['is_focused'] else 'DISTRACTED'} | "
                  f"Emotion: {last_emotion['emotion']} | "
                  f"Gesture: {last_gesture['gesture']}", end="\r")

            # Display frame
            cv2.imshow("Focus or Die - Full Vision Test", frame)

            # Check for quit
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    finally:
        focus_detector.release()
        emotion_detector.release()
        gesture_detector.release()
        cap.release()
        cv2.destroyAllWindows()
        print("\n✅ Vision test completed.")

if __name__ == "__main__":
    run_all_detectors()
