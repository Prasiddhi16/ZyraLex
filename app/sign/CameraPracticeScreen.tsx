import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResizeMode, Video } from "expo-av";
import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { useSignModule } from '@/hooks/useSignModule';
import { recordPracticeAttempt } from '@/lib/queries/signModule';
import { supabase } from '@/lib/supabase';

export default function CameraPracticeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const router = useRouter();

  const { levelId, lessonId } = useLocalSearchParams<any>();
  const { lessonMap, loading, levels } = useSignModule();

  const [index, setIndex] = useState(0);
  const [ isCapturing, setIsCapturing ] = useState(false);
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  // progress simulation while waiting
  useEffect(() => {
    let interval: any;
    if (loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 400);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const lesson = lessonMap[`${levelId}_${lessonId}`];
  const currentSign = lesson?.signs[index];
 
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }


  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "white" }}>
          Waiting for camera permission...
        </Text>
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "white" }}>
          Lesson not found.
        </Text>
      </View>
    );
  }

  const captureBurst = async () => {
    if (!cameraRef.current) return;

    try {
      setIsCapturing(true);
      const images: string[] = [];

      for (let i = 0; i < 10; i++) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.4,
          skipProcessing: true,
          base64: false,
          exif: false,
          // disable sound
          mute: true,
        });

        images.push(photo.uri);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await sendImages(images);
    } catch (e) {
      console.log(e);
    } finally {
      setIsCapturing(false);
    }
  };

  const sendImages = async (images: string[]) => {
    try {
      const formData = new FormData();

      images.forEach((uri, i) => {
        formData.append("images", {
          uri,
          name: `frame_${i}.jpg`,
          type: "image/jpeg",
        } as any);
      });

      formData.append("target_sign", currentSign?.label ?? "");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch("http://192.168.22.167:8000/predict", {
        method: "POST",
        body: formData as any,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        signal: controller.signal as any,
      });
      clearTimeout(timeoutId);

      const result: any = await response.json();
      console.log(result);

      setScore(result.score || 0);
      setFeedback(result.feedback || "");
      setProgress(100); // complete when backend responds

      try {
        const { data: { user } } = await supabase.auth.getUser();
        const levelNumber = Number(String(levelId).replace('level-', ''));
        const lessonNumber = lesson ? Number(lesson.lessonId.replace('lesson-', '')) : NaN;
        if (user && currentSign && lesson?.lessonUuid && !Number.isNaN(levelNumber) && !Number.isNaN(lessonNumber)) {
          await recordPracticeAttempt({
            userId: user.id,
            signId: currentSign.signId,
            accuracy: result.score || 0,
            lessonUuid: lesson.lessonUuid,
            levelNumber,
            lessonNumber,
          });
        }
      } catch (logErr) {
        console.log('Failed to save practice attempt:', logErr);
      }
    } catch (e) {
      console.log(e);
      setFeedback("Couldn't reach the practice server — check your connection.");
    }
  };
const markLessonComplete = async () => {
  // Mark this lesson as completed
  await AsyncStorage.setItem(
    `camera_${levelId}_${lessonId}_completed`,
    "true"
  );

  const currentLevel = levels.find(
    (l) => l.levelId === levelId
  );

  if (!currentLevel) return;

  const results = await Promise.all(
    currentLevel.lessons.map((lesson) =>
      AsyncStorage.getItem(
        `camera_${levelId}_${lesson.lessonId}_completed`
      )
    )
  );

  const allComplete = results.every(
    (value) => value === "true"
  );

  if (allComplete) {
    await AsyncStorage.setItem(
      `camera_level_${levelId}_completed`,
      "true"
    );
  }
};
  const next = async () => {
  setFeedback("");
  setScore(0);

  if (index < lesson.signs.length - 1) {
    setIndex(index + 1);
  } else {
    await markLessonComplete();
    setShowCompleteModal(true);
  }
};

  const prev = () => {
    setFeedback("");
    setScore(0);
    setIndex(Math.max(0, index - 1));
  };


  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="front" />

      <View style={styles.top}>
        {currentSign?.video ? (
        <Video
          source={{ uri: currentSign.video }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping
        />
         ) : (
        <Text style={{ color: 'white' }}>Video missing</Text>
        )}
        <Text style={styles.title}>{currentSign?.label}</Text>
      </View>

      {isCapturing && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="white" />
          <Text style={{ color: "white", marginTop: 46 }}>
            Processing gesture...
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      )}

      <View style={styles.bottom}>
        <Text style={styles.score}>{score.toFixed(1)}%</Text>
        <Text style={styles.feedback}>{feedback}</Text>
        <Text style={styles.progress}>
          {index + 1} / {lesson.signs.length}
        </Text>

        <View style={styles.row}>
          <TouchableOpacity style={styles.btn} onPress={prev}>
            <Text style={styles.btnText}>Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={next}>
            <Text style={styles.btnText}>Next</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.capture} onPress={captureBurst}>
          <Text style={styles.captureText}>Capture Gesture</Text>
        </TouchableOpacity>
      </View>
      <Modal
  visible={showCompleteModal}
  transparent
  animationType="fade"
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <Text style={styles.modalTitle}>
        Lesson Complete 🎉
      </Text>

      <TouchableOpacity
        onPress={() => {
          setIndex(0);
          setScore(0);
          setFeedback("");
          setShowCompleteModal(false);
        }}
      >
        <Text style={styles.modalButton}>
          Practice Again
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setShowCompleteModal(false);
          router.push("/sign/practicegrid");
        }}
      >
        <Text style={styles.modalButton}>
          Exit
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  top: { position: "absolute", right: 20, top: 50, alignItems: "center" ,marginTop:-20},
  video: { width: 150, height: 150, borderRadius: 20 },
  title: { color: "white", marginTop: 5, fontWeight: "bold", fontSize: 16 },
  bottom: { position: "absolute", bottom: 30, width: "100%", alignItems: "center" },
  score: { color: "white", fontSize: 42, fontWeight: "bold" },
  feedback: { color: "white", fontSize: 18, marginTop: 8 },
  progress: { color: "#bbb", marginTop: 5 },
  row: { flexDirection: "row", gap: 20, marginTop: 20 },
  btn: { backgroundColor: "#333", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnText: { color: "white", fontWeight: "bold" },
  capture: { marginTop: 20, backgroundColor: "#22c55e", paddingHorizontal: 30, paddingVertical: 14, borderRadius: 12 },
  captureText: { color: "white", fontWeight: "bold", fontSize: 16 },
  loading: { position: "absolute", top: "45%", alignSelf: "center", alignItems: "center" },
  progressBar: { width: 200, height: 10, backgroundColor: "#333", marginTop: 50, borderRadius: 5 },
  progressFill: { height: 10, backgroundColor: "#22c55e", borderRadius: 5 },
  modalOverlay: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "rgba(0,0,0,0.5)",
},

modalBox: {
  width: "80%",
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 24,
  alignItems: "center",
},

modalTitle: {
  fontSize: 22,
  fontWeight: "700",
  marginBottom: 20,
},

modalButton: {
  fontSize: 18,
  color: "#16A34A",
  fontWeight: "600",
  marginTop: 16,
},
});
