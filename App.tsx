import React, { useState, useRef } from 'react';
import { Layout } from './components/Layout';
import { Recorder } from './components/Recorder';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { LoginScreen } from './components/LoginScreen';
import { MOCK_STUDENTS } from './constants';
import { Student, Lesson, ScreenState, LessonAIOutputs, LessonStatus } from './types';
import { processLessonAudio } from './services/geminiService';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChevronRight, User, ArrowLeft, Send, Copy, Mail, ListChecks, Music, CheckCircle } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Register GSAP plugin
gsap.registerPlugin(useGSAP);

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const AppContent: React.FC = () => {
  const { user, logout, isLoading } = useAuth();

  // State
  const [screen, setScreen] = useState<ScreenState>('DASHBOARD');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Review State (Editable)
  const [reviewData, setReviewData] = useState<LessonAIOutputs | null>(null);

  // Mock "Database" in local state (in a real app, this would be fetched based on user.id)
  const [students] = useState<Student[]>(MOCK_STUDENTS);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  // Animation Ref
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation Logic
  useGSAP(() => {
    if (!user) return; // Don't animate if not logged in

    // Reset any potential conflict styles
    gsap.set(".gsap-fade-in", { clearProps: "all" });
    gsap.set(".gsap-stagger", { clearProps: "all" });
    gsap.set(".gsap-scale-up", { clearProps: "all" });

    // Elegant Fade In & Slide Up for headers
    gsap.from(".gsap-fade-in", {
      y: 15,
      opacity: 0,
      duration: 0.6,
      ease: "power3.out",
      clearProps: "all"
    });

    // Staggered entry for lists and cards
    gsap.from(".gsap-stagger", {
      y: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.08,
      delay: 0.1,
      ease: "power2.out",
      clearProps: "all"
    });

    // Subtle scale up for primary actions/cards
    gsap.from(".gsap-scale-up", {
      scale: 0.96,
      opacity: 0,
      duration: 0.5,
      delay: 0.05,
      ease: "back.out(1.5)",
      clearProps: "all"
    });

  }, { dependencies: [screen, user], scope: containerRef });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Helpers
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const sendEmail = () => {
    if (!reviewData || !selectedStudent?.parent_email) return;
    
    const subject = `Music Lesson Update: ${selectedStudent.full_name}`;
    const body = `${reviewData.parent_email}\n\nPractice Plan:\n${reviewData.practice_plan}`;
    
    window.open(`mailto:${selectedStudent.parent_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  // Navigation Handlers
  const goHome = () => {
    setScreen('DASHBOARD');
    setSelectedStudent(null);
    setCurrentLesson(null);
    setReviewData(null);
    setError(null);
  };

  const selectStudent = (student: Student) => {
    setSelectedStudent(student);
    setScreen('STUDENT_DETAIL');
  };

  const startNewLesson = () => {
    setScreen('RECORDING');
  };

  const saveLessonChanges = () => {
    if (!currentLesson || !reviewData) return;
    
    const updatedLesson = {
      ...currentLesson,
      outputs: reviewData,
      status: LessonStatus.COMPLETED
    };

    setLessons(prev => prev.map(l => l.id === updatedLesson.id ? updatedLesson : l));
    setCurrentLesson(updatedLesson);
    showNotification("Lesson saved successfully!");
  };

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    if (!selectedStudent) return;

    setScreen('PROCESSING');
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create a temporary lesson ID
      const newLessonId = generateId();
      const tempLesson: Lesson = {
        id: newLessonId,
        student_id: selectedStudent.id,
        date: new Date().toISOString(),
        duration_sec: duration, 
        status: LessonStatus.PROCESSING,
        audio_url: URL.createObjectURL(blob)
      };
      
      setCurrentLesson(tempLesson);

      // 2. Process with Gemini
      const base64Audio = await blobToBase64(blob);
      const mimeType = blob.type || 'audio/webm';
      
      console.log(`Processing audio: ${mimeType}, Size: ${blob.size}`);

      const outputs = await processLessonAudio(
        base64Audio,
        mimeType,
        selectedStudent.full_name,
        selectedStudent.instrument
      );

      // 3. Update Lesson with results
      const completedLesson: Lesson = {
        ...tempLesson,
        status: LessonStatus.READY_REVIEW,
        outputs: outputs
      };

      setLessons(prev => [completedLesson, ...prev]);
      setCurrentLesson(completedLesson);
      setReviewData(outputs); // Initialize editable state
      setScreen('REVIEW');

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process lesson. Please try again.");
      setScreen('DASHBOARD'); // Fallback
    } finally {
      setIsProcessing(false);
    }
  };

  // Render Functions
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between gsap-fade-in">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Students</h2>
        <Button variant="secondary" size="sm">+ Add Student</Button>
      </div>
      <div className="grid gap-3">
        {students.map(student => (
          <div key={student.id} className="gsap-stagger">
            <Card 
              className="p-4 flex items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer active:scale-[0.99] group"
              onClick={() => selectStudent(student)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold group-hover:scale-110 transition-transform">
                  {student.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{student.full_name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{student.instrument}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
            </Card>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStudentDetail = () => {
    if (!selectedStudent) return null;
    const studentLessons = lessons.filter(l => l.student_id === selectedStudent.id);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4 gsap-fade-in">
          <Button variant="ghost" size="icon" onClick={goHome}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedStudent.full_name}</h2>
        </div>
        
        <div className="gsap-scale-up">
          <Card className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-900 text-white shadow-lg shadow-indigo-200 dark:shadow-none border-none">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-indigo-100 font-medium opacity-90">{selectedStudent.instrument}</p>
                <h1 className="text-3xl font-bold mt-1">Ready for lesson?</h1>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
            {/* Enhanced Legibility: White background in light mode, Off-white (indigo-50) in dark mode to avoid glare while maintaining high contrast with indigo-700 text */}
            <Button 
              className="w-full bg-white text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-50 dark:text-indigo-700 dark:hover:bg-indigo-100 border-none font-bold shadow-sm" 
              size="lg"
              onClick={startNewLesson}
            >
              Start New Lesson
            </Button>
          </Card>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 gsap-fade-in">Recent Lessons</h3>
          {studentLessons.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 gsap-fade-in">
              <p className="text-slate-500 dark:text-slate-400">No lessons recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {studentLessons.map(lesson => (
                <div key={lesson.id} className="gsap-stagger">
                  <Card className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {new Date(lesson.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            lesson.status === LessonStatus.COMPLETED 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {lesson.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {Math.floor(lesson.duration_sec / 60)}:{(lesson.duration_sec % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setCurrentLesson(lesson);
                        setReviewData(lesson.outputs || null);
                        setScreen('REVIEW');
                      }}>View</Button>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRecording = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 gsap-fade-in">
        <Button variant="ghost" size="icon" onClick={() => setScreen('STUDENT_DETAIL')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recording Lesson</h2>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md gsap-scale-up">
          <Card className="p-6">
            <Recorder onRecordingComplete={handleRecordingComplete} />
          </Card>
        </div>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="h-full flex flex-col items-center justify-center space-y-6 p-8 text-center">
      <div className="relative gsap-scale-up">
        <div className="w-24 h-24 border-4 border-indigo-100 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Music className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
        </div>
      </div>
      <div className="gsap-fade-in">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Analyzing Audio</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          AI is listening to the lesson, extracting practice items, and drafting your email...
        </p>
      </div>
    </div>
  );

  const renderReview = () => {
    if (!currentLesson || !reviewData) return null;

    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between sticky top-16 bg-slate-50 dark:bg-slate-950 z-40 py-2 border-b border-slate-200 dark:border-slate-800 transition-colors gsap-fade-in">
           <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setScreen('STUDENT_DETAIL')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Review Summary</h2>
           </div>
           <Button variant="primary" size="sm" onClick={saveLessonChanges}>Save Changes</Button>
        </div>

        {/* Audio Player */}
        {currentLesson.audio_url && (
          <div className="gsap-stagger">
            <Card className="p-4 flex items-center gap-4 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                  <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">Lesson Recording</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">
                    {Math.floor(currentLesson.duration_sec / 60)}:{(currentLesson.duration_sec % 60).toString().padStart(2, '0')}
                  </p>
              </div>
              <audio controls src={currentLesson.audio_url} className="h-8 w-40" />
            </Card>
          </div>
        )}

        {/* Section 1: Recap */}
        <section className="space-y-2 gsap-stagger">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
            <User className="w-5 h-5" />
            <h3>Student Recap</h3>
          </div>
          <Card className="p-4 transition-all focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-400">
            <textarea 
              className="w-full h-32 p-2 text-slate-700 dark:text-slate-200 bg-transparent resize-y focus:outline-none"
              value={reviewData.student_recap}
              onChange={(e) => setReviewData({...reviewData, student_recap: e.target.value})}
            />
            <div className="flex justify-end mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
               <Button variant="ghost" size="sm" className="text-slate-400 gap-2" onClick={() => copyToClipboard(reviewData.student_recap)}>
                 <Copy className="w-4 h-4" /> Copy
               </Button>
            </div>
          </Card>
        </section>

        {/* Section 2: Practice Plan */}
        <section className="space-y-2 gsap-stagger">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
            <ListChecks className="w-5 h-5" />
            <h3>Practice Plan</h3>
          </div>
          <Card className="p-4 border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 transition-all focus-within:ring-2 focus-within:ring-emerald-500">
            <textarea 
              className="w-full h-48 p-2 text-slate-700 dark:text-slate-200 bg-transparent resize-y focus:outline-none font-mono text-sm"
              value={reviewData.practice_plan}
              onChange={(e) => setReviewData({...reviewData, practice_plan: e.target.value})}
            />
             <div className="flex justify-end mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/50">
               <Button variant="ghost" size="sm" className="text-slate-400 gap-2" onClick={() => copyToClipboard(reviewData.practice_plan)}>
                 <Copy className="w-4 h-4" /> Copy
               </Button>
            </div>
          </Card>
        </section>

        {/* Section 3: Email */}
        <section className="space-y-2 gsap-stagger">
           <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
            <Mail className="w-5 h-5" />
            <h3>Parent Email</h3>
          </div>
          <Card className="p-4 border-blue-100 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/10 transition-all focus-within:ring-2 focus-within:ring-blue-500">
            <div className="mb-2 text-xs text-slate-400">To: {selectedStudent?.parent_email}</div>
            <textarea 
              className="w-full h-40 p-2 text-slate-700 dark:text-slate-200 bg-transparent resize-y focus:outline-none"
              value={reviewData.parent_email}
              onChange={(e) => setReviewData({...reviewData, parent_email: e.target.value})}
            />
             <div className="flex justify-end mt-2 pt-2 border-t border-blue-100 dark:border-blue-900/50 gap-2">
               <Button variant="ghost" size="sm" className="text-slate-400 gap-2" onClick={() => copyToClipboard(reviewData.parent_email)}>
                 <Copy className="w-4 h-4" /> Copy
               </Button>
               <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={sendEmail}>
                 <Send className="w-4 h-4" /> Send Email
               </Button>
            </div>
          </Card>
        </section>
      </div>
    );
  };

  return (
    <Layout 
      userEmail={user.email} 
      studioName={user.studio_name} 
      onHome={goHome}
      onLogout={logout}
    >
      <div ref={containerRef} className="h-full">
        {screen === 'DASHBOARD' && renderDashboard()}
        {screen === 'STUDENT_DETAIL' && renderStudentDetail()}
        {screen === 'RECORDING' && renderRecording()}
        {screen === 'PROCESSING' && renderProcessing()}
        {screen === 'REVIEW' && renderReview()}
      </div>
      
      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-100 p-4 rounded-lg shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-bottom-5 z-50">
           <span>{error}</span>
           <button onClick={() => setError(null)} className="font-bold">✕</button>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-4 left-4 right-4 bg-slate-800 dark:bg-indigo-900 text-white p-4 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 z-50">
           <CheckCircle className="w-5 h-5 text-green-400" />
           <span>{notification}</span>
        </div>
      )}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;