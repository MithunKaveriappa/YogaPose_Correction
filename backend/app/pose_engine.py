import json
import os
import numpy as np
from typing import List, Dict, Any, Optional

# Body Landmark Indices mapping (MediaPipe Pose 33 keypoints)
BODY_PARTS_MAP = {
    'left_elbow': {'idx': 0, 'name': 'Left Elbow', 'landmark_ids': [11, 13, 15]},      # shoulder, elbow, wrist
    'right_elbow': {'idx': 1, 'name': 'Right Elbow', 'landmark_ids': [12, 14, 16]},    # shoulder, elbow, wrist
    'right_knee': {'idx': 2, 'name': 'Right Knee', 'landmark_ids': [28, 26, 24]},       # ankle, knee, hip
    'left_knee': {'idx': 3, 'name': 'Left Knee', 'landmark_ids': [27, 25, 23]},        # ankle, knee, hip
    'right_shoulder': {'idx': 4, 'name': 'Right Shoulder', 'landmark_ids': [14, 12, 24]},# elbow, shoulder, hip
    'left_shoulder': {'idx': 5, 'name': 'Left Shoulder', 'landmark_ids': [13, 11, 23]}, # elbow, shoulder, hip
    'left_hip': {'idx': 6, 'name': 'Left Hip', 'landmark_ids': [25, 23, 11]},           # knee, hip, shoulder
    'right_hip': {'idx': 7, 'name': 'Right Hip', 'landmark_ids': [26, 24, 12]}          # knee, hip, shoulder
}

def calculate_angle(a: List[float], b: List[float], c: List[float]) -> float:
    """Calculate internal angle (in degrees) at point B given points A, B, and C."""
    a_arr = np.array(a[:2])
    b_arr = np.array(b[:2])
    c_arr = np.array(c[:2])

    rad = np.arctan2(c_arr[1] - b_arr[1], c_arr[0] - b_arr[0]) - np.arctan2(a_arr[1] - b_arr[1], a_arr[0] - b_arr[0])
    angle = np.abs(rad * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360.0 - angle
    return float(angle)


class PoseEngine:
    def __init__(self, json_path: Optional[str] = None):
        if not json_path:
            json_path = os.path.join(os.path.dirname(__file__), 'poses_data.json')
        
        with open(json_path, 'r') as f:
            self.poses_database: Dict[str, List[float]] = json.load(f)

    def get_available_poses(self) -> List[str]:
        return sorted(list(self.poses_database.keys()))

    def compute_joint_angles(self, landmarks: List[Dict[str, float]]) -> List[float]:
        """Compute the 8 key joint angles from normalized landmarks list."""
        angles = []
        # Ensure landmarks format is dict with 'x', 'y'
        for part_key in ['left_elbow', 'right_elbow', 'right_knee', 'left_knee',
                         'right_shoulder', 'left_shoulder', 'left_hip', 'right_hip']:
            ids = BODY_PARTS_MAP[part_key]['landmark_ids']
            p_a = [landmarks[ids[0]]['x'], landmarks[ids[0]]['y']]
            p_b = [landmarks[ids[1]]['x'], landmarks[ids[1]]['y']]
            p_c = [landmarks[ids[2]]['x'], landmarks[ids[2]]['y']]
            angle = calculate_angle(p_a, p_b, p_c)
            angles.append(angle)
        return angles

    def evaluate_pose(self, landmarks: List[Dict[str, float]], pose_name: str, error_threshold: float = 25.0) -> Dict[str, Any]:
        if pose_name not in self.poses_database:
            return {"error": f"Pose '{pose_name}' not found in benchmark database."}

        target_angles = self.poses_database[pose_name]
        user_angles = self.compute_joint_angles(landmarks)

        joint_results = []
        total_error = 0.0
        good_count = 0

        parts_keys = ['left_elbow', 'right_elbow', 'right_knee', 'left_knee',
                      'right_shoulder', 'left_shoulder', 'left_hip', 'right_hip']

        for i, key in enumerate(parts_keys):
            target = target_angles[i]
            current = user_angles[i]
            diff = abs(current - target)
            total_error += diff
            
            is_correct = diff <= error_threshold
            if is_correct:
                good_count += 1

            # Advice string for joint
            if current < target - error_threshold:
                correction = "Open/Extend joint further"
            elif current > target + error_threshold:
                correction = "Bend/Close joint slightly"
            else:
                correction = "Optimal alignment"

            joint_results.append({
                "part": BODY_PARTS_MAP[key]['name'],
                "key": key,
                "target_angle": round(target, 1),
                "current_angle": round(current, 1),
                "angle_diff": round(diff, 1),
                "is_correct": is_correct,
                "correction_hint": correction
            })

        # Overall score computation (100 - average angle error clamped between 0 and 100)
        avg_error = total_error / len(parts_keys)
        accuracy_score = max(0, min(100, round(100 - avg_error, 1)))

        return {
            "pose_name": pose_name,
            "accuracy_score": accuracy_score,
            "is_pose_matched": good_count >= 6,  # 6 of 8 joints correct
            "good_joints_count": good_count,
            "total_joints": 8,
            "joint_details": joint_results,
            "user_angles": [round(a, 1) for a in user_angles],
            "target_angles": [round(t, 1) for t in target_angles]
        }
