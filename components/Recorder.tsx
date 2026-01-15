import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from './ui/Button';

interface RecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
}

export const Recorder: React.FC<RecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  
  // FIX: Use a ref to track duration synchronously for the onstop callback
  const durationRef = useRef(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Detect supported MIME type for the browser
  const getSupportedMimeType = () => {
    const types = [
      'audio/mp4', // Safari / iOS
      'audio/webm;codecs=opus', // Chrome / Firefox
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/aac'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return ''; // Fallback to browser default
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        // Use the actual mime type from the recorder or the one we selected
        const finalMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: finalMimeType });
        
        // FIX: Read from the ref to get the accurate duration at the moment of stopping
        const finalDuration = durationRef.current;
        console.log("Recording stopped. Duration:", finalDuration);
        
        onRecordingComplete(blob, finalDuration);
        
        stopVisualization();
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
      startVisualization(stream);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure you have granted permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const startTimer = () => {
    setDuration(0);
    durationRef.current = 0; // Reset ref
    
    timerRef.current = window.setInterval(() => {
      durationRef.current += 1; // Update ref synchronously
      setDuration(prev => prev + 1); // Update state for UI
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Visualization Logic
  const startVisualization = (stream: MediaStream) => {
    if (!canvasRef.current) return;
    
    // Close existing context if any
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioCtx;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    
    if (!canvasCtx) return;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      // Canvas background should be transparent to show the circle color, or match it
      // For simplicity, we clear it fully.
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Gradient for bars
        const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#4f46e5'); // Indigo-600
        gradient.addColorStop(1, '#818cf8'); // Indigo-400

        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const stopVisualization = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };
  
  useEffect(() => {
    return () => {
      stopTimer();
      stopVisualization();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-8 w-full">
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Pulse effect */}
        {isRecording && (
           <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-ping opacity-75"></div>
        )}
        
        <div className="relative bg-white dark:bg-slate-800 rounded-full p-2 shadow-xl border-4 border-slate-100 dark:border-slate-700 z-10 w-full h-full flex flex-col items-center justify-center overflow-hidden transition-colors duration-300">
           <canvas 
            ref={canvasRef} 
            width={240} 
            height={240} 
            className="absolute inset-0 opacity-50 pointer-events-none"
           />
           <div className="z-20 flex flex-col items-center">
             <div className="text-4xl font-mono font-bold text-slate-700 dark:text-slate-100 tabular-nums">
               {formatTime(duration)}
             </div>
             {/* Improved contrast: slate-400 on slate-800 is better than slate-500 */}
             <p className="text-slate-400 dark:text-slate-400 text-sm mt-2 font-medium uppercase tracking-wide">
               {isRecording ? "Recording" : "Ready"}
             </p>
           </div>
        </div>
      </div>

      <div className="flex gap-4">
        {!isRecording ? (
          <Button 
            onClick={startRecording} 
            size="lg" 
            className="rounded-full w-20 h-20 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-none transition-transform active:scale-95 flex items-center justify-center"
            aria-label="Start Recording"
          >
            <Mic className="w-8 h-8 text-white" />
          </Button>
        ) : (
          <Button 
            onClick={stopRecording} 
            size="lg" 
            className="rounded-full w-20 h-20 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 shadow-lg transition-transform active:scale-95 flex items-center justify-center"
             aria-label="Stop Recording"
          >
            <Square className="w-8 h-8 text-white fill-current" />
          </Button>
        )}
      </div>
      
      <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-xs">
        {isRecording 
          ? "Tap the square to finish the lesson." 
          : "Tap the microphone to start recording the lesson."}
      </p>
    </div>
  );
};