from flask import Flask, render_template, Response
from flask_socketio import SocketIO
import YogaPose
import mediapipe as mp
import cv2
import time
import os

app = Flask(__name__)
socket = SocketIO(app)

global camera


def landVal(i, j):
    # Define a dictionary to map positions to values
    position_mapping = {
        (0, 1): 13,  # left elbow
        (0, 2): 14,  # right elbow
        (1, 1): 26,  # right knee
        (1, 2): 27,  # left knee
        (2, 1): 12,  # right shoulder
        (2, 2): 11,  # left shoulder
        (3, 1): 23,  # left hip
        (3, 2): 24  # right hip
    }

    try:
        return position_mapping[(i, j)]
    except KeyError:
        return IndexError


def clear_terminal():
    os.system('cls')


class PoseDetector:
    def __init__(self):
        if hasattr(mp, 'solutions'):
            self.use_legacy = True
            self.mp_drawing = mp.solutions.drawing_utils
            self.mp_pose = mp.solutions.pose
            self.pose_engine = self.mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
        else:
            self.use_legacy = False
            from mediapipe.tasks.python import vision
            from mediapipe.tasks import python as mp_python

            model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pose_landmarker_lite.task')
            base_options = mp_python.BaseOptions(model_asset_path=model_path)
            options = vision.PoseLandmarkerOptions(
                base_options=base_options,
                running_mode=vision.RunningMode.IMAGE,
                min_pose_detection_confidence=0.5,
                min_pose_presence_confidence=0.5
            )
            self.landmarker = vision.PoseLandmarker.create_from_options(options)
            self.vision = vision

    def detect_landmarks(self, frame_bgr):
        if self.use_legacy:
            image_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            res = self.pose_engine.process(image_rgb)
            landmarks = res.pose_landmarks.landmark if res.pose_landmarks else None
            return frame_bgr, res, landmarks
        else:
            image_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
            res = self.landmarker.detect(mp_image)
            landmarks = res.pose_landmarks[0] if (res.pose_landmarks and len(res.pose_landmarks) > 0) else None
            return frame_bgr, res, landmarks

    def draw_landmarks(self, image_bgr, res, landmarks):
        if self.use_legacy:
            if res.pose_landmarks:
                self.mp_drawing.draw_landmarks(image_bgr, res.pose_landmarks, self.mp_pose.POSE_CONNECTIONS)
        else:
            if landmarks:
                h, w, _ = image_bgr.shape
                for conn in self.vision.PoseLandmarksConnections.POSE_LANDMARKS:
                    if conn.start < len(landmarks) and conn.end < len(landmarks):
                        start_lm = landmarks[conn.start]
                        end_lm = landmarks[conn.end]
                        pt1 = (int(start_lm.x * w), int(start_lm.y * h))
                        pt2 = (int(end_lm.x * w), int(end_lm.y * h))
                        cv2.line(image_bgr, pt1, pt2, (245, 117, 66), 2)
                for lm in landmarks:
                    cx, cy = int(lm.x * w), int(lm.y * h)
                    cv2.circle(image_bgr, (cx, cy), 4, (0, 255, 0), -1)


class CamInput:
    def __init__(self) -> None:
        self.camera = cv2.VideoCapture(0)
        self.obj = YogaPose.MatchYogaPos()

        self.height = 640
        self.width = 640
        self.text = 'good'
        self.fontFace = cv2.FONT_HERSHEY_SIMPLEX
        self.fontScale = 0.5
        self.color = (0, 225, 0)  # Color in BGR format
        self.thickness = 1
        self.lineType = cv2.LINE_AA
        self.x1 = 10
        self.y1 = 10
        self.org = (self.x1, self.y1)
        self.isStarted = False

    def gen_frames(self):
        self.frame_count = 0
        frameRate = 30
        timegiven = 5
        detector = PoseDetector()

        while self.camera.isOpened():
            success, frame = self.camera.read()
            if self.isStarted and self.frame_count < (frameRate * timegiven):
                self.frame_count += 1
            elif self.isStarted and self.frame_count == (frameRate * timegiven):
                print('time up')
                self.isStarted = False

            if not success:
                break

            image, res, landmarks = detector.detect_landmarks(frame)
            detector.draw_landmarks(image, res, landmarks)

            if landmarks:
                temp_list = self.obj.matchYogaPos(landmarks, 'Trikonasana')

                for i in range(4):
                    if not temp_list[i][0]:
                        for j in range(1, 3):
                            text1 = str(round(temp_list[i][j]))
                            lm_idx = landVal(i, j)
                            x1 = int(landmarks[lm_idx].x * self.width) + 3
                            y1 = int(landmarks[lm_idx].y * self.height) + 3
                            org1 = (x1, y1)
                            color = (0, 0, 225)
                            cv2.putText(image, text1, org1, self.fontFace, self.fontScale, color, self.thickness,
                                        self.lineType)
                    elif temp_list[i][0]:
                        for j in range(1, 3):
                            color = (0, 225, 0)
                            lm_idx = landVal(i, j)
                            x1 = int(landmarks[lm_idx].x * self.width) + 3
                            y1 = int(landmarks[lm_idx].y * self.height) + 3
                            org1 = (x1, y1)
                            cv2.putText(image, self.text, org1, self.fontFace, self.fontScale, color, self.thickness,
                                        self.lineType)

            ret, buffer = cv2.imencode('.jpg', image)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    def close_cam(self):
        self.camera.release()


global cam_obj


@app.route('/')
def home():
    global cam_obj
    cam_obj = CamInput()
    return render_template('index.html')


@app.route('/video_feed')
def video_feed():
    return Response(cam_obj.gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/start', methods=['POST'])
def start():
    cam_obj.isStarted = not cam_obj.isStarted  # for testing only
    return 'pose started'


@app.route('/close_webcam', methods=['POST'])
def close_webcam():
    global camera
    global cam_obj
    cam_obj.close_cam()
    return "Webcam Closed"


if __name__ == "__main__":
    socket.run(app, allow_unsafe_werkzeug=True, debug=True)

