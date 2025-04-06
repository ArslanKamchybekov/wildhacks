import cv2
import time

def test_camera():
    print("Opening camera...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open camera.")
        return False
    
    print("Camera opened successfully!")
    print("Press 'q' to exit the test.")
    
    start_time = time.time()
    while (time.time() - start_time) < 10:
 
        ret, frame = cap.read()
        
        if not ret:
            print("Error: Can't receive frame. Exiting...")
            break
        
        cv2.imshow('Camera Test', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
    print("Camera test completed.")
    return True

if __name__ == "__main__":
    test_camera()