import cv2
import numpy as np
import asyncio
import websockets
import json

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")


async def stream_gaze():
    uri = "ws://127.0.0.1:8000/ws/camera"
    cap = cv2.VideoCapture(0)

    SCREEN_WIDTH = 1920
    SCREEN_HEIGHT = 1080
    CAM_WIDTH = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
    CAM_HEIGHT = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480

    print(f"Connecting to ZyraLex Server at {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Successfully connected! Initializing real-time gaze capture...")
            while True:
                ret, frame = cap.read()
                if not ret:
                    print("Error: Failed to grab frame from webcam.")
                    break

                frame = cv2.flip(frame, 1)
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)
                face_detected = len(faces) > 0
                packet = {
                    "raw_x": 0,
                    "raw_y": 0,
                    "face_detected": face_detected
                }

                for (x, y, w, h) in faces:
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                    face_roi_gray = gray[y:y + h, x:x + w]
                    face_roi_color = frame[y:y + h, x:x + w]
                    eyes = eye_cascade.detectMultiScale(face_roi_gray)

                    for (ex, ey, ew, eh) in eyes:
                        eye = face_roi_color[ey:ey + eh, ex:ex + ew]
                        eye_gray = cv2.cvtColor(eye, cv2.COLOR_BGR2GRAY)
                        eye_gray = cv2.GaussianBlur(eye_gray, (7, 7), 0)
                        _, threshold = cv2.threshold(eye_gray, 35, 255, cv2.THRESH_BINARY_INV)
                        contours, _ = cv2.findContours(threshold, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
                        contours = sorted(contours, key=lambda c: cv2.contourArea(c), reverse=True)

                        for cnt in contours:
                            if cv2.contourArea(cnt) < 100:
                                continue

                            (cx, cy, cw, ch) = cv2.boundingRect(cnt)
                            pupil_cam_x = x + ex + cx + cw // 2
                            pupil_cam_y = y + ey + cy + ch // 2

                            screen_x = int((pupil_cam_x / CAM_WIDTH) * SCREEN_WIDTH)
                            screen_y = int((pupil_cam_y / CAM_HEIGHT) * SCREEN_HEIGHT)

                            packet["raw_x"] = max(0, min(SCREEN_WIDTH, screen_x))
                            packet["raw_y"] = max(0, min(SCREEN_HEIGHT, screen_y))

                            cv2.circle(frame, (pupil_cam_x, pupil_cam_y), 5, (0, 0, 255), -1)
                            break
                        break
                    break

                await websocket.send(json.dumps(packet))
                cv2.imshow("ZyraLex Eye Tracking Stream", frame)
                if cv2.waitKey(1) == 27:
                    break
                await asyncio.sleep(0.03)

    except Exception as e:
        print(f"Stream interrupted or connection failed: {e}")
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    asyncio.run(stream_gaze())