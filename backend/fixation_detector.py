import numpy as np
import time


class FixationDetector:
    def __init__(self, spatial_threshold=30, temporal_threshold=0.3):
        self.spatial_threshold = spatial_threshold
        self.temporal_threshold = temporal_threshold
        self.gaze_history = []

    def process_point(self, x, y):
        current_time = time.time()
        self.gaze_history.append((current_time, x, y))
        self.gaze_history = [p for p in self.gaze_history if current_time - p[0] <= 2.0]

        if len(self.gaze_history) < 2:
            return False, None, None, 0.0

        xs = [p[1] for p in self.gaze_history]
        ys = [p[2] for p in self.gaze_history]
        dispersion = (max(xs) - min(xs)) + (max(ys) - min(ys))

        if dispersion <= self.spatial_threshold:
            duration = self.gaze_history[-1][0] - self.gaze_history[0][0]
            if duration >= self.temporal_threshold:
                centroid_x = int(np.mean(xs))
                centroid_y = int(np.mean(ys))
                return True, centroid_x, centroid_y, duration
            return False, None, None, duration
        else:
            # Gaze has moved too far - not a fixation, reset history
            self.gaze_history = self.gaze_history[-1:]
            return False, None, None, 0.0