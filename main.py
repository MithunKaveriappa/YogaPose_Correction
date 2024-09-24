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

    # Check if the position is in the dictionary, otherwise return IndexError
    try:
        return position_mapping[(i, j)]
    except KeyError:
        return IndexError

def clear_terminal():
    os.system('cls')

class CamInput:
    def __init__(self) -> None:
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_pose = mp.solutions.pose
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
        with self.mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
            while self.camera.isOpened():
                success, frame = self.camera.read()
                if self.isStarted and self.frame_count < (frameRate * timegiven):
                    self.frame_count += 1
                elif self.isStarted and self.frame_count == (frameRate * timegiven):
                    print('time up')
                    self.isStarted = False

                if not success:
                    break
                else:
                    image = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                    image.flags.writeable = False

                    res = pose.process(image)
                    image.flags.writeable = True
                    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

                self.mp_drawing.draw_landmarks(
                    image,
                    res.pose_landmarks,
                    self.mp_pose.POSE_CONNECTIONS,
                )

                if res.pose_landmarks:
                    temp_list = self.obj.matchYogaPos(res.pose_landmarks.landmark, 'Trikonasana')

                    for i in range(4):
                        if not temp_list[i][0]:
                            for j in range(1, 3):
                                text1 = str(round(temp_list[i][j]))
                                x1 = int(res.pose_landmarks.landmark[landVal(i, j)].x * self.width) + 3
                                y1 = int(res.pose_landmarks.landmark[landVal(i, j)].y * self.height) + 3
                                org1 = (x1, y1)
                                color = (0, 0, 225)
                                cv2.putText(image, text1, org1, self.fontFace, self.fontScale, color, self.thickness,
                                            self.lineType)
                        elif temp_list[i][0]:
                            for j in range(1, 3):
                                color = (0, 225, 0)
                                x1 = int(res.pose_landmarks.landmark[landVal(i, j)].x * self.width) + 3
                                y1 = int(res.pose_landmarks.landmark[landVal(i, j)].y * self.height) + 3
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
    cam_obj.isStarted = not cam_obj.isStarted # for testing only
    # cam_obj.isStarted = True
    return 'pose started'

@app.route('/close_webcam', methods=['POST'])
def close_webcam():
    global camera
    global cam_obj
    cam_obj.close_cam()
    return "Webcam Closed"

if __name__ == "__main__":
    from waitress import serve
    serve(app, host='0.0.0.0', port=5000)
