import os
import json
from typing import Dict, Any, Optional

try:
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class AICoachService:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.client = None
        if GENAI_AVAILABLE and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[AICoachService] Warning: Could not initialize Gemini client: {e}")

    def generate_realtime_coaching(self, evaluation_result: Dict[str, Any]) -> str:
        """Generate short, encouraging real-time correction prompt for voice/UI."""
        pose_name = evaluation_result.get("pose_name", "Yoga Pose")
        score = evaluation_result.get("accuracy_score", 0)
        joint_details = evaluation_result.get("joint_details", [])

        # Find key joints that need adjustment
        incorrect_joints = [j for j in joint_details if not j["is_correct"]]

        if not incorrect_joints:
            return f"Excellent posture! Your {pose_name} alignment is spot on. Hold it steadily and focus on deep breaths."

        primary_mistake = max(incorrect_joints, key=lambda j: j["angle_diff"])
        part_name = primary_mistake["part"]
        diff = primary_mistake["angle_diff"]
        hint = primary_mistake["correction_hint"]

        # If Gemini client is active, request LLM guidance
        if self.client:
            try:
                prompt = (
                    f"You are an encouraging AI Yoga Instructor. The student is practicing '{pose_name}'. "
                    f"Their overall accuracy score is {score}%. "
                    f"The biggest mistake is at their {part_name} (angle error of {diff} degrees: {hint}). "
                    f"Give a single, concise (max 15 words) spoken coaching correction."
                )
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                if response and response.text:
                    return response.text.strip().replace('"', '')
            except Exception as e:
                print(f"[AICoachService] Gemini call failed: {e}. Falling back to rule-based hint.")

        # Smart fallback
        return f"Focus on your {part_name}. {hint} (off by ~{round(diff)}°)."

    def generate_session_summary(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate post-session analysis report."""
        pose_name = session_data.get("pose_name", "Pose")
        avg_score = session_data.get("average_score", 85.0)
        duration_sec = session_data.get("duration_seconds", 30)

        if self.client:
            try:
                prompt = (
                    f"You are a master yoga instructor. Review this session data: "
                    f"Pose: {pose_name}, Average Score: {avg_score}%, Duration: {duration_sec} seconds. "
                    f"Provide: 1. Key Accomplishment, 2. Alignment Focus for Next Time, 3. Recommended Warm-up Pose. "
                    f"Return response strictly as JSON with keys 'accomplishment', 'next_focus', 'recommended_pose'."
                )
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                if response and response.text:
                    cleaned_text = response.text.strip()
                    if cleaned_text.startswith("```json"):
                        cleaned_text = cleaned_text.split("```json")[1].split("```")[0].strip()
                    return json.loads(cleaned_text)
            except Exception as e:
                print(f"[AICoachService] Session summary LLM call failed: {e}")

        # Fallback summary report
        return {
            "accomplishment": f"Great effort holding {pose_name} for {duration_sec} seconds with {avg_score}% accuracy!",
            "next_focus": "Work on keeping your core engaged and breathing steadily throughout posture transitions.",
            "recommended_pose": "Balasana (Child's Pose) for gentle spinal decompression."
        }
