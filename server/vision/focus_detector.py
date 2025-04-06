import cv2
import mediapipe as mp
import numpy as np
import time
from collections import deque

class SimpleFocusDetector:
    def __init__(self):
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        self.mp_face_mesh = mp.solutions.face_mesh
        
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        self.focus_history = deque(maxlen=10)
        self.last_processed_time = 0
        self.frame_interval = 0.15  # Process every 150ms
        self.last_focus_state = {'is_focused': False, 'eye_aspect_ratio': 0, 'gaze_score': 0, 'gaze_direction': ''}
        self.last_face_landmarks = None
        
        # Store last debug stats to prevent flickering
        self.last_debug_stats = {'v_ratio': 0, 'h_ratio': 0, 'gaze_direction': '', 'angle': 0}
        
        self.config = {
            'min_eye_aspect_ratio': 0.18,
            'gaze_direction_threshold': 0.60,
            'vertical_gaze_weight': 2.5,
            'downward_threshold': 0.25,
            'upward_threshold': 0.18,
            'horizontal_gaze_weight': 2.0,
            'center_weight': 2.5
        }
    
    def process_frame(self, frame):
        current_time = time.time()
        focus_state = self.last_focus_state.copy()
        
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb_frame.flags.writeable = False
        
        process_this_frame = current_time - self.last_processed_time > self.frame_interval
        
        if process_this_frame:
            self.last_processed_time = current_time
            results = self.face_mesh.process(rgb_frame)
            
            rgb_frame.flags.writeable = True
            frame = cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2BGR)
            
            focus_state = {'is_focused': False, 'eye_aspect_ratio': 0, 'gaze_score': 0, 'gaze_direction': ''}
            
            if results.multi_face_landmarks:
                self.last_face_landmarks = results.multi_face_landmarks[0]
                face_landmarks = self.last_face_landmarks
                
                eye_data = self._process_eye_landmarks(face_landmarks, frame)
                
                self.focus_history.append(eye_data['is_looking_at_screen'])
                
                is_focused = sum(self.focus_history) / len(self.focus_history) > 0.7 if self.focus_history else False
                
                focus_state = {
                    'is_focused': is_focused,
                    'eye_aspect_ratio': eye_data['eye_aspect_ratio'],
                    'gaze_score': eye_data['gaze_direction_score'],
                    'gaze_direction': eye_data['gaze_direction']
                }
                
                self.last_focus_state = focus_state
        else:
            # If we're skipping this frame, convert the RGB frame back to BGR
            frame = cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2BGR)
            
            # If we haven't processed in a while, assume distraction
            time_since_last_process = current_time - self.last_processed_time
            if time_since_last_process > self.frame_interval * 3:
                self.focus_history.append(False)
        
        # Always draw the face mesh if we have landmarks
        if self.last_face_landmarks is not None:
            self._draw_face_mesh(frame, self.last_face_landmarks)
        
        # Always display debug stats from stored values
        h, w, _ = frame.shape
        debug = self.last_debug_stats
        cv2.putText(frame, f"V-ratio: {debug['v_ratio']:.2f}", 
                   (w - 140, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
        cv2.putText(frame, f"H-ratio: {debug['h_ratio']:.2f}", 
                   (w - 140, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
        cv2.putText(frame, f"Gaze: {debug['gaze_direction']}", 
                   (w - 140, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
        cv2.putText(frame, f"Angle: {debug['angle']:.1f}", 
                   (w - 140, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            
        # Always draw debug info
        self._draw_debug_info(frame, focus_state)
            
        return frame, focus_state
    
    def _draw_face_mesh(self, frame, face_landmarks):
        self.mp_drawing.draw_landmarks(
            image=frame,
            landmark_list=face_landmarks,
            connections=self.mp_face_mesh.FACEMESH_TESSELATION,
            landmark_drawing_spec=None,
            connection_drawing_spec=self.mp_drawing_styles.get_default_face_mesh_tesselation_style()
        )
        
        self.mp_drawing.draw_landmarks(
            image=frame,
            landmark_list=face_landmarks,
            connections=self.mp_face_mesh.FACEMESH_CONTOURS,
            landmark_drawing_spec=None,
            connection_drawing_spec=self.mp_drawing_styles.get_default_face_mesh_contours_style()
        )
    
    def _process_eye_landmarks(self, face_landmarks, frame):
        landmarks = np.array([(lm.x, lm.y, lm.z) for lm in face_landmarks.landmark])
        
        left_eye_indices = [33, 160, 158, 133, 153, 144]
        right_eye_indices = [362, 385, 387, 263, 373, 380]
        
        left_eye = landmarks[left_eye_indices]
        right_eye = landmarks[right_eye_indices]
        
        left_ear = self._calculate_ear(left_eye)
        right_ear = self._calculate_ear(right_eye)
        avg_ear = (left_ear + right_ear) / 2.0
        
        gaze_result = self._estimate_gaze_direction(landmarks, frame)
        gaze_score = gaze_result['score']
        gaze_direction = gaze_result['direction']
        
        is_looking_at_screen = (avg_ear > self.config['min_eye_aspect_ratio'] and 
                               gaze_score > self.config['gaze_direction_threshold'] and
                               gaze_direction != "UP")  # Always flag upward gaze as not focused
        
        h, w, _ = frame.shape
        for eye in [left_eye, right_eye]:
            for point in eye:
                px, py = int(point[0] * w), int(point[1] * h)
                cv2.circle(frame, (px, py), 2, (0, 255, 0), -1)
        
        return {
            'eye_aspect_ratio': avg_ear,
            'gaze_direction_score': gaze_score,
            'is_looking_at_screen': is_looking_at_screen,
            'gaze_direction': gaze_direction
        }
    
    def _calculate_ear(self, eye):
        v1 = np.linalg.norm(eye[1] - eye[5])
        v2 = np.linalg.norm(eye[2] - eye[4])
        
        h = np.linalg.norm(eye[0] - eye[3])
        
        if h == 0:
            return 0
        
        return (v1 + v2) / (2.0 * h)
    
    def _estimate_gaze_direction(self, landmarks, frame):
        nose = landmarks[1]
        left_eye = landmarks[33]
        right_eye = landmarks[263]
        chin = landmarks[152]
        forehead = landmarks[10]
        left_ear_point = landmarks[234]
        right_ear_point = landmarks[454]
        
        h, w, _ = frame.shape
        center_x, center_y = 0.5, 0.5
        
        nose_offset_x = abs(nose[0] - center_x)
        nose_offset_y = abs(nose[1] - center_y)
        
        left_eye_dist = np.linalg.norm(nose[:2] - left_eye[:2])
        right_eye_dist = np.linalg.norm(nose[:2] - right_eye[:2])
        
        ear_ratio = np.linalg.norm(nose[:2] - left_ear_point[:2]) / np.linalg.norm(nose[:2] - right_ear_point[:2])
        horizontal_score = 1.0 - min(1.0, abs(ear_ratio - 1.0) * self.config['horizontal_gaze_weight'])
        
        symmetry_score = 1.0 - min(1.0, abs(left_eye_dist - right_eye_dist) * 10)
        
        eye_level_diff = abs(left_eye[1] - right_eye[1])
        eye_level_score = 1.0 - min(1.0, eye_level_diff * 20)
        
        center_score = 1.0 - min(1.0, (nose_offset_x + nose_offset_y) * self.config['center_weight'])
        
        vertical_ratio = (nose[1] - forehead[1]) / max(0.001, (chin[1] - forehead[1]))
        vertical_gaze_score = 1.0
        
        # Additional check for upward gaze - calculate angle of gaze
        eye_center = (left_eye + right_eye) / 2
        gaze_vector = np.array([eye_center[0] - nose[0], eye_center[1] - nose[1]])
        gaze_angle = np.degrees(np.arctan2(gaze_vector[1], gaze_vector[0]))
        
        # Check if eyes are higher than forehead (strong indicator of looking up)
        eyes_above_forehead = (eye_center[1] < forehead[1])
        
        if vertical_ratio > 0.60:
            downward_amount = (vertical_ratio - 0.60) / 0.40
            vertical_gaze_score = max(0, 1.0 - (downward_amount * self.config['vertical_gaze_weight']))
            
            if vertical_gaze_score < self.config['downward_threshold']:
                vertical_gaze_score = 0.0
        elif vertical_ratio < 0.43:  # More sensitive for upward detection
            upward_amount = (0.43 - vertical_ratio) / 0.43
            vertical_gaze_score = max(0, 1.0 - (upward_amount * (self.config['vertical_gaze_weight'] * 1.5)))
            
            if vertical_gaze_score < self.config['upward_threshold'] or eyes_above_forehead:
                vertical_gaze_score = 0.0
        
        if nose_offset_x > 0.15:
            horizontal_score *= 0.5
            
        gaze_score = (
            center_score * 0.25 + 
            symmetry_score * 0.05 +
            horizontal_score * 0.30 +
            eye_level_score * 0.05 +
            vertical_gaze_score * 0.35
        )
        
        nose_px = int(nose[0] * w)
        nose_py = int(nose[1] * h)
        chin_px = int(chin[0] * w)
        chin_py = int(chin[1] * h)
        forehead_px = int(forehead[0] * w)
        forehead_py = int(forehead[1] * h)
        
        cv2.circle(frame, (nose_px, nose_py), 5, (0, 0, 255), -1)
        cv2.circle(frame, (chin_px, chin_py), 3, (255, 0, 0), -1)
        cv2.circle(frame, (forehead_px, forehead_py), 3, (255, 0, 0), -1)
        
        left_ear_px = int(left_ear_point[0] * w)
        left_ear_py = int(left_ear_point[1] * h)
        right_ear_px = int(right_ear_point[0] * w)
        right_ear_py = int(right_ear_point[1] * h)
        
        cv2.circle(frame, (left_ear_px, left_ear_py), 3, (0, 255, 255), -1)
        cv2.circle(frame, (right_ear_px, right_ear_py), 3, (0, 255, 255), -1)
        
        # Draw eye center for debugging
        eye_center_px = int(eye_center[0] * w)
        eye_center_py = int(eye_center[1] * h)
        cv2.circle(frame, (eye_center_px, eye_center_py), 4, (255, 0, 255), -1)
        
        gaze_direction = "CENTER"
        if vertical_ratio > 0.60:
            gaze_direction = "DOWN"
        elif vertical_ratio < 0.43 or eyes_above_forehead:
            gaze_direction = "UP"
        elif ear_ratio < 0.80:
            gaze_direction = "RIGHT"
        elif ear_ratio > 1.20:
            gaze_direction = "LEFT"
        
        # Store the debug stats to prevent flickering
        self.last_debug_stats = {
            'v_ratio': vertical_ratio,
            'h_ratio': ear_ratio,
            'gaze_direction': gaze_direction,
            'angle': gaze_angle
        }
        
        return {'score': gaze_score, 'direction': gaze_direction}
    
    def _draw_debug_info(self, frame, focus_state):
        h, w, _ = frame.shape
        
        # Draw a more stable overlay box at the top-left
        cv2.rectangle(frame, (10, 10), (280, 130), (0, 0, 0), -1)
        
        # Status with persistent color
        status_color = (0, 255, 0) if focus_state['is_focused'] else (0, 0, 255)
        status_text = "FOCUSED" if focus_state['is_focused'] else "DISTRACTED"
        
        cv2.putText(frame, f"Status: {status_text}", 
                   (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)
        
        # Draw the stats with larger size and better spacing
        cv2.putText(frame, f"Eye AR: {focus_state['eye_aspect_ratio']:.2f}", 
                   (20, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)
        
        cv2.putText(frame, f"Gaze Score: {focus_state['gaze_score']:.2f}", 
                   (20, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)
    
    def release(self):
        self.face_mesh.close()