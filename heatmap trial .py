import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

asana = "Halasana" # The asana selected by the user 

body_parts = ["Left Elbow", "Right Elbow", "right knee", "left knee", "right shoulder", "left shoulder", "left hip", "right hip"]
correct_angles = [30, 45, 60, 90, 120, 135, 150, 180]  # Dhruva we need to pass or add the absolute angles here 
user_angles = [35, 42, 65, 88, 125, 130, 145, 175]  # The user angles are to be passed here


angle_differences = np.array(correct_angles) - np.array(user_angles)

heatmap_data = angle_differences.reshape(1, -1)


sns.heatmap(heatmap_data, annot=True, cmap= "Greens", xticklabels=body_parts, yticklabels=False)


plt.xlabel("Body Parts")
plt.ylabel("Difference in Angles")
plt.title(f"Angle Differences for Yoga Pose {asana}")

plt.show()
