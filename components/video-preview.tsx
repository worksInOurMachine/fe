"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import MetricsPanel from "@/components/MetricsPanel";
import { motion } from "framer-motion";

interface EmotionData {
  timestamp: number;
  confidence: number;
  happy: number;
  sad: number;
  nervous: number;
  surprised: number;
  blink: number;
}

export default function EmotionAnalyzerPage({ startFn, stopFn }: any) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState(true);

  const [blinkRate, setBlinkRate] = useState(0);
  const [nervousness, setNervousness] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [surprised, setSurprised] = useState(0);
  const [happy, setHappy] = useState(0);
  const [sad, setSad] = useState(0);

  const blinkTimestampsRef = useRef<number[]>([]);
  const earHistoryRef = useRef<number[]>([]);
  const lastEmotionRef = useRef({
    happy: 0,
    sad: 0,
    nervous: 0,
    surprised: 0,
    confidence: 0,
    mar: 0,
    ear: 0,
    blink: 0,
    nose: 0,
  });

  const sessionDataRef = useRef<EmotionData[]>([]);

  const euclid = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);
  const smooth = (prev: number, current: number, alpha = 0.3) =>
    prev * (1 - alpha) + current * alpha;

  const eyeAspectRatio = (lm: any, idxs: number[]) => {
    const [p0, p1, p2, p3, p4, p5] = idxs.map((i) => lm[i]);
    const A = euclid(p1, p5);
    const B = euclid(p2, p4);
    const C = euclid(p0, p3);
    return C === 0 ? 0 : (A + B) / (2 * C);
  };

  const mouthAspectRatio = (lm: any) => {
    const vertical = euclid(lm[13], lm[14]);
    const horizontal = euclid(lm[61], lm[291]);
    return horizontal === 0 ? 0 : vertical / horizontal;
  };

  const smileScore = (lm: any) => {
    const mouthWidth = euclid(lm[61], lm[291]);
    const mouthHeight = euclid(lm[13], lm[14]);
    const faceWidth = euclid(lm[234], lm[454]);
    if (!faceWidth) return 0;
    const ratio = (mouthWidth / faceWidth) * (mouthHeight / faceWidth) * 12;
    return Math.min(Math.max(ratio, 0), 1);
  };

  const headPose = (lm: any) => {
    const nose = lm[1];
    const centerX = (lm[234].x + lm[454].x) / 2;
    const centerY = (lm[152].y + lm[10].y) / 2;
    return { yaw: nose.x - centerX, pitch: nose.y - centerY };
  };

  const onResults = (results: any) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d")!;
    
    // Maintain aspect ratio while filling container
    const containerWidth = canvas.parentElement?.clientWidth || 640;
    const containerHeight = canvas.parentElement?.clientHeight || 480;
    
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw flipped video for natural feel
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    if (!results.multiFaceLandmarks || !results.multiFaceLandmarks[0]) return;

    const lm = results.multiFaceLandmarks[0];
    
    // Custom styled connectors for a more techy feel
    // @ts-ignore
    drawConnectors(ctx, lm, FACEMESH_TESSELATION, {
      color: "rgba(255, 255, 255, 0.15)",
      lineWidth: 0.5,
    });
    // @ts-ignore
    drawConnectors(ctx, lm, FACEMESH_LEFT_EYE, { color: "rgba(59, 130, 246, 0.6)", lineWidth: 1 });
    // @ts-ignore
    drawConnectors(ctx, lm, FACEMESH_RIGHT_EYE, { color: "rgba(59, 130, 246, 0.6)", lineWidth: 1 });
    // @ts-ignore
    drawConnectors(ctx, lm, FACEMESH_LIPS, { color: "rgba(255, 255, 255, 0.4)", lineWidth: 1 });

    const leftEAR = eyeAspectRatio(lm, [33, 160, 158, 133, 153, 144]);
    const rightEAR = eyeAspectRatio(lm, [263, 387, 385, 362, 380, 373]);
    const ear = (leftEAR + rightEAR) / 2;
    earHistoryRef.current.push(ear);
    if (earHistoryRef.current.length > 300) earHistoryRef.current.shift();

    const prevEar = earHistoryRef.current[earHistoryRef.current.length - 2] || ear;
    if (prevEar > 0.2 && ear <= 0.2) blinkTimestampsRef.current.push(Date.now());
    const oneMinuteAgo = Date.now() - 60000;
    blinkTimestampsRef.current = blinkTimestampsRef.current.filter((t) => t > oneMinuteAgo);
    const br = blinkTimestampsRef.current.length;
    setBlinkRate(br);

    const mar = mouthAspectRatio(lm);
    const smile = smileScore(lm);
    const pose = headPose(lm);

    const blinkFeature = Math.min(br / 30, 1);
    const marFeature = Math.min(mar / 0.45, 1);
    const gazeAversion = Math.min(Math.abs(pose.yaw) / 0.15, 1);
    const headDown = Math.min(Math.max(pose.pitch / 0.15, -1), 1);

    const earMean = earHistoryRef.current.reduce((a, b) => a + b, 0) / earHistoryRef.current.length;
    const earStd = Math.sqrt(earHistoryRef.current.reduce((s, x) => s + (x - earMean) ** 2, 0) / earHistoryRef.current.length) || 0.0001;
    const eyeWideFeature = Math.min(Math.max((ear - earMean) / (2 * earStd), 0), 1);
    const browDist = euclid(lm[105], lm[159]);
    const faceHeight = euclid(lm[10], lm[152]) || 1;
    const browFeature = Math.min(Math.max((browDist / faceHeight - 0.03) / 0.06, 0), 1);
    const deltaMar = Math.min(Math.max((mar - (lastEmotionRef.current.mar || mar)) * 10, 0), 1);
    const deltaEar = Math.min(Math.max((ear - (lastEmotionRef.current.ear || ear)) * 10, 0), 1);

    let rawSurprise = 0.4 * marFeature + 0.3 * eyeWideFeature + 0.2 * browFeature + 0.1 * Math.max(deltaMar, deltaEar);
    rawSurprise *= 1 - smile;
    const finalSurprise = smooth(lastEmotionRef.current.surprised, rawSurprise);
    setSurprised(Number(finalSurprise.toFixed(2)));

    const gazeFactor = 1 - gazeAversion;
    const happyRaw = smooth(lastEmotionRef.current.happy, Math.min(Math.max(0.6 * smile + 0.3 * browFeature + 0.1 * (1 - marFeature), 0), 1) * gazeFactor);
    setHappy(Number(happyRaw.toFixed(2)));

    const mouthDown = (lm[61].y + lm[291].y) / 2 - lm[0].y;
    const originalSad = Math.min(Math.max(0.4 * headDown + 0.3 * Math.max(-mouthDown / faceHeight, 0) + 0.2 * (1 - browFeature) + 0.1 * marFeature, 0), 1) * gazeFactor;
    const sadRaw = smooth(lastEmotionRef.current.sad, 0.5 * (1 - happyRaw) + 0.5 * originalSad);
    setSad(Number(sadRaw.toFixed(2)));

    const nervousRaw = smooth(lastEmotionRef.current.nervous, Math.min(1, 0.5 * blinkFeature + 0.3 * gazeAversion + 0.2 * marFeature + 0.2 * (1 - happyRaw)));
    setNervousness(Number(nervousRaw.toFixed(2)));

    const gazeFeature = 1 - gazeAversion;
    const currentNose = lm[1];
    const lastNose = lastEmotionRef.current.nose as any;
    const stabilityFeature = 1 - Math.min(1, Math.hypot(currentNose.x - (lastNose?.x || currentNose.x), currentNose.y - (lastNose?.y || currentNose.y)) * 50);
    const gazeStability = Math.min(1, 1 - Math.abs(pose.yaw) * 2) * Math.min(1, 1 - Math.abs(pose.pitch) * 2);

    const pos = 0.35 * smile + 0.25 * gazeFeature + 0.2 * gazeStability + 0.15 * (1 - headDown) + 0.25 * stabilityFeature;
    const neg = 0.6 * nervousRaw + 0.15 * (finalSurprise * (1 - smile)) + 0.4 * gazeAversion;
    const rawConf = Math.max(-1, Math.min(1, pos - neg));
    const logistic = 1 / (1 + Math.exp(-3 * rawConf));
    let finalConf = smooth(lastEmotionRef.current.confidence, logistic, 0.2);

    setConfidence(Number(finalConf.toFixed(2)));

    lastEmotionRef.current = {
      happy: happyRaw,
      sad: sadRaw,
      nervous: nervousRaw,
      surprised: finalSurprise,
      confidence: finalConf,
      mar,
      ear,
      blink: br,
      nose: lm[1],
    };

    sessionDataRef.current.push({
      timestamp: Date.now(),
      confidence: finalConf,
      happy: happyRaw,
      sad: sadRaw,
      nervous: nervousRaw,
      surprised: finalSurprise,
      blink: br,
    });

    // Drawing sophisticated status indicator in corner
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.roundRect(10, 10, 120, 24, 6);
    ctx.fill();
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(22, 22, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("LIVE ANALYSIS", 32, 25);
  };

  const generateFeedback = () => {
    const data = sessionDataRef.current;
    if (!data.length) return "No session data recorded.";

    const avg = (key: keyof EmotionData) =>
      data.reduce((sum, d) => sum + d[key], 0) / data.length;
    const feedback: string[] = [];

    const conf = avg("confidence");
    const nerv = avg("nervous");
    const happ = avg("happy");
    const sadScore = avg("sad");

    feedback.push(conf < 0.8 ? "Maintain eye contact and use open body language to project more confidence." : "Excellent confidence and technical presence displayed.");
    feedback.push(nerv > 0.2 ? "Focus on steady breathing to reduce visible signs of nervousness." : "You maintained a calm and composed demeanor throughout.");
    feedback.push(happ < 0.45 ? "Try to incorporate subtle, professional smiles to build rapport." : "Your friendly and approachable attitude was a key strength.");
    
    return feedback.join("\n");
  };

  const stop = () => {
    try {
      cameraRef.current?.stop();
    } catch {}
    setRunning(false);
    return generateFeedback();
  };

  const start = async () => {
    if (running || !loaded) return;
    const video = videoRef.current!;
    
    if (!faceMeshRef.current) {
      faceMeshRef.current = new (window as any).FaceMesh({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
      });
      faceMeshRef.current.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      faceMeshRef.current.onResults(onResults);
    }

    if (!cameraRef.current) {
      cameraRef.current = new (window as any).Camera(video, {
        onFrame: async () => await faceMeshRef.current.send({ image: video }),
        width: 1280,
        height: 720,
      });
    }

    try {
      await cameraRef.current.start();
      setRunning(true);
    } catch (err) {
      console.error("Camera access failed", err);
    }
  };

  useEffect(() => {
    startFn(() => start);
    stopFn(() => stop);
  }, [startFn, stopFn]);

  return (
    <div className="flex h-full w-full flex-col bg-black relative">
       {/* Background Glow */}
       <div className="absolute inset-0 bg-blue-500/5 blur-[100px] pointer-events-none" />
       
       <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video ref={videoRef} className="hidden" playsInline></video>
        <canvas ref={canvasRef} className="w-full h-full object-cover"></canvas>
        
        {!running && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Waiting for camera...</p>
            </div>
        )}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl"
        >
            <MetricsPanel
                blinkRate={blinkRate}
                confidence={confidence}
                nervousness={nervousness}
                happy={happy}
                sad={sad}
            />
        </motion.div>
      </div>
    </div>
  );
}
