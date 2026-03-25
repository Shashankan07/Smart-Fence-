
import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Settings, Activity, Cloud, BarChart2, Menu, User, Lock, LogIn, LogOut, ShieldCheck, FolderInput, Wifi, X, Check, Cpu, Zap, Radio, Play, Tv, AlertCircle } from 'lucide-react';
import { IoTData, INITIAL_STATE } from './types';
import { subscribeToESP32, getEsp32Config, setEsp32Config } from './services/esp32Service';

// Import Views
import { Overview } from './views/Overview';
import { SystemControl } from './views/SystemControl';
import { SensorMonitoring } from './views/SensorMonitoring';
import { EnvironmentMonitoring } from './views/EnvironmentMonitoring';
import { Analytics } from './views/Analytics';

type ViewName = 'overview' | 'control' | 'sensors' | 'environment' | 'analytics';

// User Database (Username - Password)
const AUTH_USERS = [
  { name: 'Shiva', pass: '12345', avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBEeTxP8KssJfbMMrxGc7Le5Qv37425gm-0KfpC-cDWZFHzrDynOLnOTQ&s' },
  { name: 'Deva', pass: '0987', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Deva' },
  { name: 'Leyon', pass: '1234', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Leyon' },
  { name: 'Lokith', pass: '6789', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Lokith' },
  { name: 'Sha', pass: '09876', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sha' },
];

// --- FREE GENERATIVE GRAPHICS ENGINE (Canvas) ---
const GenerativeIntro = ({ onComplete }: { onComplete: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    let frame = 0;
    const totalFrames = 400; // ~6 seconds
    
    // Create Grid Nodes
    const nodes: {x: number, y: number, active: boolean, connect: boolean}[] = [];
    for(let x=0; x<width; x+=80) {
        for(let y=0; y<height; y+=80) {
            // Hex-like offset
            const offsetY = (x/80) % 2 === 0 ? 0 : 40;
            if(Math.random() > 0.3) nodes.push({x, y: y + offsetY, active: false, connect: false});
        }
    }

    const draw = () => {
        // Clear with fade effect
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, width, height);
        
        frame++;
        const progress = frame / totalFrames;
        const scanY = (frame * 8) % (height + 200);

        // 1. Grid Points
        nodes.forEach(n => {
            // Activation Wave
            if(Math.abs(n.y - scanY) < 50) n.active = true;
            if(Math.abs(n.y - scanY) < 100) n.connect = true;
            
            if(n.active) {
                const alpha = Math.max(0, 1 - (scanY - n.y)/400);
                ctx.fillStyle = `rgba(6, 182, 212, ${alpha})`;
                ctx.fillRect(n.x, n.y, 2, 2);
            }
        });

        // 2. Dynamic Connections (The "Fence" Building)
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        nodes.forEach((n, i) => {
            if(n.connect && n.active && Math.random() > 0.9) {
                 // Connect to random neighbor
                 const neighbor = nodes[Math.floor(Math.random() * nodes.length)];
                 const dist = Math.hypot(n.x - neighbor.x, n.y - neighbor.y);
                 if(dist < 100) {
                     ctx.moveTo(n.x, n.y);
                     ctx.lineTo(neighbor.x, neighbor.y);
                 }
            }
        });
        ctx.stroke();

        // 3. Radar Sweep
        const cx = width/2;
        const cy = height/2;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)'; // Red sweep
        ctx.beginPath();
        ctx.arc(cx, cy, frame * 2, 0, Math.PI*2);
        ctx.stroke();

        // 4. Text Overlay
        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        
        if (frame < 100) ctx.fillText(`BOOT_SEQUENCE_INIT...`, cx, cy + 200);
        else if (frame < 200) ctx.fillText(`ESTABLISHING_SECURE_UPLINK...`, cx, cy + 200);
        else if (frame < 300) ctx.fillText(`CALIBRATING_SENSORS...`, cx, cy + 200);
        else ctx.fillText(`ACCESS_GRANTED`, cx, cy + 200);

        // Progress Bar
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx - 150, cy + 220, 300, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx - 150, cy + 220, 300 * progress, 4);

        if(frame < totalFrames) {
            requestAnimationFrame(draw);
        } else {
            onComplete();
        }
    };
    
    requestAnimationFrame(draw);
    
    const handleResize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black">
        <canvas ref={canvasRef} className="block" />
        <button 
            onClick={onComplete}
            className="absolute bottom-10 right-10 text-white font-mono text-xs border border-white/20 px-4 py-2 hover:bg-white/10"
        >
            SKIP SEQUENCE &gt;&gt;
        </button>
    </div>
  );
}

export default function App() {
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Animation State for Cinematic Login
  const [introStep, setIntroStep] = useState(0); // 0: Init, 1: Slash, 2: Reveal UI
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDiving, setIsDiving] = useState(false);

  // Video/Intro State
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);

  // Dashboard State
  const [currentView, setCurrentView] = useState<ViewName>('overview');
  const [data, setData] = useState<IoTData>(INITIAL_STATE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Connection Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [configIp, setConfigIp] = useState('');
  
  // User Profile State
  const [currentUser, setCurrentUser] = useState(AUTH_USERS[0]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // --- SURVEILLANCE & CAPTURE LOGIC ---
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [saveDirHandle, setSaveDirHandle] = useState<any>(null); // Handle for the selected directory
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const lastCaptureTime = useRef<number>(0);

  // Load initial IP config
  useEffect(() => {
    if (isSettingsOpen) {
        setConfigIp(getEsp32Config().ip);
    }
  }, [isSettingsOpen]);

  // Trigger Mass Intro Animation
  useEffect(() => {
    if (!isAuthenticated) {
        // Step 1: Smoke & Darkness (0ms)
        // Step 2: Slash Reveal (1500ms)
        setTimeout(() => setIntroStep(1), 1500);
        // Step 3: UI Slam (2000ms)
        setTimeout(() => setIntroStep(2), 2000);
    }
  }, [isAuthenticated]);

  const handleSaveConfig = () => {
    setEsp32Config(configIp, false);
    setIsSettingsOpen(false);
    setData(prev => ({ ...prev, online: false }));
  };

  const toggleGlobalCamera = async () => {
    if (!window.isSecureContext) {
        alert(
          `⚠️ CAMERA SECURITY RESTRICTION ⚠️\n\n` +
          `Your browser has BLOCKED camera access because the context is treated as insecure.\n\n` +
          `If you are on HTTP (e.g. 192.168.x.x), you MUST enable the Chrome Flag to allow this.\n\n` +
          `HOW TO FIX:\n` +
          `1. Go to 'chrome://flags/#unsafely-treat-insecure-origin-as-secure'\n` +
          `2. Enable it.\n` +
          `3. Add this URL: ${window.location.origin}\n` +
          `4. Relaunch Chrome completely.`
        );
        return; 
    }

    if (isCameraActive) {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      setCameraStream(null);
      setIsCameraActive(false);
      if (hiddenVideoRef.current) hiddenVideoRef.current.srcObject = null;
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
           throw new Error("Media Devices API not available in this context");
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 1280, height: 720, facingMode: 'user' } 
        });
        setCameraStream(stream);
        setIsCameraActive(true);
        if (hiddenVideoRef.current) {
            hiddenVideoRef.current.srcObject = stream;
            hiddenVideoRef.current.play();
        }
      } catch (err: any) {
        console.error("Global Camera Error:", err);
        alert(
            `CAMERA ACCESS DENIED:\n` +
            `${err.message || 'Permission denied'}.\n\n` +
            `Please check the camera permissions icon in your browser address bar.`
        );
      }
    }
  };

  const selectSaveDirectory = async () => {
    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker();
      setSaveDirHandle(handle);
      alert(`Storage Linked: Snapshots will be saved to "${handle.name}"`);
    } catch (err) {
      console.error("Directory selection failed:", err);
    }
  };

  const captureAndSave = (sensorName: string) => {
    if (!hiddenVideoRef.current || !isCameraActive) return;

    const now = Date.now();
    if (now - lastCaptureTime.current < 5000) return; 

    lastCaptureTime.current = now;

    const video = hiddenVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.font = "24px monospace";
        ctx.fillStyle = "red";
        ctx.fillText(`ALERT: ${sensorName}`, 20, 40);
        ctx.fillText(`TIME: ${new Date().toLocaleString()}`, 20, 70);

        const filename = `Image_Detected_${sensorName}.png`;

        canvas.toBlob(async (blob) => {
            if (!blob) return;

            if (saveDirHandle) {
                try {
                    const fileHandle = await saveDirHandle.getFileHandle(filename, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    return;
                } catch (e) {
                    console.error("Direct save failed, falling back to download:", e);
                }
            }

            const dataUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(dataUrl);
        }, 'image/png');
    }
  };

  useEffect(() => {
    subscribeToESP32((newData) => {
      setData((prev) => {
          const now = new Date();
          const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
          
          const newPoint = {
              time: timeString,
              temp: newData.temperature ?? prev.temperature ?? 0,
              hum: newData.humidity ?? prev.humidity ?? 0,
              soil: newData.soilMoisture ?? prev.soilMoisture ?? 0,
              rain: newData.rain ?? prev.rain ?? 0,
              smoke: newData.smoke ?? prev.smoke ?? 0
          };
          
          const updatedHistory = [...prev.history, newPoint].slice(-30);
          const newLogs = [...prev.logs];
          const addLog = (msg: string, type: 'alert' | 'info' | 'error') => {
             if (newLogs.length === 0 || newLogs[0].message !== msg) {
                 newLogs.unshift({ timestamp: timeString, message: msg, type });
             }
          };

          if (newData.pir === 'ACTIVE' && prev.pir !== 'ACTIVE') addLog("Motion Sensor Triggered (PIR)", 'alert');
          if (newData.vibration === 'ACTIVE' && prev.vibration !== 'ACTIVE') addLog("Fence Vibration Detected", 'alert');
          if (newData.poleTamper === 'ACTIVE' && prev.poleTamper !== 'ACTIVE') addLog("Pole Tamper Switch Activation", 'error');
          if (newData.boxTamper === 'ACTIVE' && prev.boxTamper !== 'ACTIVE') addLog("Control Box Door Opened", 'error');
          
          if (newData.fenceActive !== undefined && newData.fenceActive !== null && newData.fenceActive !== prev.fenceActive) {
              if (prev.fenceActive !== null) {
                 addLog(`Fence Power ${newData.fenceActive ? 'ARMED' : 'DISARMED'}`, 'info');
              }
          }
          
          if (newData.online && !prev.online) addLog("ESP32 Connection Established", 'info');
          if (newData.online === false && prev.online) addLog("ESP32 Connection Lost", 'error');

          const updated = { 
              ...prev, 
              ...newData,
              history: updatedHistory,
              logs: newLogs.slice(0, 50)
          };
          
          if (isCameraActive) {
              if (updated.vibration === 'ACTIVE') captureAndSave('Vibration');
              if (updated.poleTamper === 'ACTIVE') captureAndSave('Fence_Gate');
              if (updated.boxTamper === 'ACTIVE') captureAndSave('Control_Box');
              if (updated.pir === 'ACTIVE') captureAndSave('Motion');
              if (updated.smoke && updated.smoke > 3000) captureAndSave('Smoke');
              if (updated.fenceCurrent && updated.fenceCurrent > 5) captureAndSave('High_Current'); 
          }
          
          return updated;
      });
    });
  }, [isCameraActive, saveDirHandle]);

  const finishLogin = () => {
    setIsPlayingIntro(false);
    setIsAuthenticated(true);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = AUTH_USERS.find(
      (u) => u.name.toLowerCase() === usernameInput.toLowerCase() && u.pass === passwordInput
    );

    if (user) {
      setIsDiving(true);
      setTimeout(() => {
          setCurrentUser(user);
          setLoginError('');
          setUsernameInput('');
          setPasswordInput('');
          setIsDiving(false);
          setIsPlayingIntro(true);
      }, 1500);
    } else {
      setLoginError('Invalid Credentials');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsProfileOpen(false);
    setCurrentView('overview');
    setIntroStep(0);
    setIsPlayingIntro(false);
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
        setIsCameraActive(false);
        setSaveDirHandle(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const x = (window.innerWidth / 2 - e.clientX) / 40;
      const y = (window.innerHeight / 2 - e.clientY) / 40;
      setMousePos({ x, y });
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'control', label: 'System Control', icon: Settings },
    { id: 'sensors', label: 'Sensor Monitor', icon: Activity },
    { id: 'environment', label: 'Environment', icon: Cloud },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ] as const;

  const renderView = () => {
    switch (currentView) {
      case 'overview': 
        return <Overview 
          data={data} 
          cameraStream={cameraStream} 
          isCameraActive={isCameraActive} 
          onToggleCamera={toggleGlobalCamera}
        />;
      case 'control': return <SystemControl 
          data={data} 
          cameraStream={cameraStream} 
          isCameraActive={isCameraActive} 
          onToggleCamera={toggleGlobalCamera} 
      />;
      case 'sensors': return <SensorMonitoring data={data} />;
      case 'environment': return <EnvironmentMonitoring data={data} />;
      case 'analytics': return <Analytics data={data} />;
      default: return <Overview 
        data={data} 
        cameraStream={cameraStream} 
        isCameraActive={isCameraActive} 
        onToggleCamera={toggleGlobalCamera}
      />;
    }
  };

  if (isPlayingIntro) {
      return <GenerativeIntro onComplete={finishLogin} />;
  }

  if (!isAuthenticated) {
    return (
      <div 
        className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center font-sans text-slate-100"
        onMouseMove={handleMouseMove}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;700;900&display=swap');
          .font-hero { font-family: 'Rajdhani', sans-serif; }
          .mass-smoke {
             position: absolute;
             background: radial-gradient(circle, rgba(100,0,0,0.1) 0%, transparent 70%);
             width: 80vw;
             height: 80vw;
             border-radius: 50%;
             filter: blur(80px);
             opacity: 0.6;
             animation: drift 20s infinite alternate;
          }
          @keyframes drift {
             from { transform: translate(-10%, -10%); }
             to { transform: translate(10%, 10%); }
          }
          .ember {
             position: absolute;
             width: 2px;
             height: 2px;
             background: #fbbf24;
             border-radius: 50%;
             box-shadow: 0 0 10px #fbbf24;
             animation: floatUp linear infinite;
          }
          @keyframes floatUp {
             0% { transform: translateY(100vh) scale(0); opacity: 0; }
             50% { opacity: 1; }
             100% { transform: translateY(-10vh) scale(1.5); opacity: 0; }
          }
          .hero-slash {
             position: absolute;
             top: 0; left: 0; width: 100%; height: 100%;
             background: white;
             transform: translateX(-100%) skewX(-20deg);
             opacity: 0;
             z-index: 50;
          }
          .slash-active {
             animation: slashAnim 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes slashAnim {
             0% { transform: translateX(-100%) skewX(-20deg); opacity: 0.5; }
             50% { opacity: 1; }
             100% { transform: translateX(100%) skewX(-20deg); opacity: 0; }
          }
          .shake-impact {
             animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          }
          @keyframes shake {
             10%, 90% { transform: translate3d(-1px, 0, 0); }
             20%, 80% { transform: translate3d(2px, 0, 0); }
             30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
             40%, 60% { transform: translate3d(4px, 0, 0); }
          }
          .molten-trace {
             stroke-dasharray: 200;
             stroke-dashoffset: 200;
             animation: flowGold 3s linear infinite;
             filter: drop-shadow(0 0 5px #ef4444);
          }
          @keyframes flowGold {
             to { stroke-dashoffset: -200; }
          }
          .neon-pulse {
             animation: neonBeat 1.5s ease-in-out infinite;
          }
          @keyframes neonBeat {
             0%, 100% { box-shadow: 0 0 20px rgba(220, 38, 38, 0.5); border-color: rgba(220, 38, 38, 0.8); }
             50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.5); border-color: rgba(251, 191, 36, 1); }
          }
          .glitch-text:hover {
             animation: textGlitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
             color: #fbbf24;
          }
          @keyframes textGlitch {
             0% { transform: translate(0) }
             20% { transform: translate(-2px, 2px) }
             40% { transform: translate(-2px, -2px) }
             60% { transform: translate(2px, 2px) }
             80% { transform: translate(2px, -2px) }
             100% { transform: translate(0) }
          }
          .clip-path-slant {
             clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 100%);
          }
        `}</style>

        <div 
          className="absolute inset-0 bg-gradient-to-b from-[#0a0000] via-[#1a0505] to-black z-0"
          style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}
        >
             <div className="mass-smoke top-[-20%] left-[-20%] bg-red-900"></div>
             <div className="mass-smoke bottom-[-20%] right-[-20%] bg-orange-900" style={{ animationDelay: '-5s' }}></div>
        </div>

        <div className="absolute inset-0 opacity-20 z-0 pointer-events-none">
            <svg width="100%" height="100%">
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ef4444" strokeWidth="0.5"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <path d="M0,100 H100 V200 H300" stroke="url(#goldGrad)" strokeWidth="2" fill="none" className="molten-trace" />
                <path d="M500,500 H800 V600" stroke="url(#goldGrad)" strokeWidth="2" fill="none" className="molten-trace" style={{ animationDelay: '1s' }} />
                <defs>
                    <linearGradient id="goldGrad">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
                        <stop offset="50%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            {[...Array(20)].map((_, i) => (
                <div 
                    key={i} 
                    className="ember" 
                    style={{ 
                        left: `${Math.random() * 100}%`, 
                        animationDuration: `${Math.random() * 3 + 2}s`, 
                        animationDelay: `${Math.random() * 2}s` 
                    }} 
                />
            ))}
        </div>

        <div className={`hero-slash ${introStep === 1 ? 'slash-active' : ''}`}></div>

        <div 
           className={`relative z-20 transition-all duration-1000 ${introStep >= 2 ? 'opacity-100 scale-100 shake-impact' : 'opacity-0 scale-90'}`}
           style={{ transform: `translate(${-mousePos.x}px, ${-mousePos.y}px)` }}
        >
             <div className="w-[400px] bg-black/60 backdrop-blur-xl border border-red-900/50 p-1 relative group neon-pulse">
                
                <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-amber-500"></div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-amber-500"></div>
                <div className="absolute top-1/2 -left-4 w-2 h-12 bg-red-600"></div>
                <div className="absolute top-1/2 -right-4 w-2 h-12 bg-red-600"></div>

                <div className="p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(255,0,0,0.02),rgba(255,0,0,0.06))] z-0 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>

                    <div className="text-center mb-8 relative z-10">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-600 blur-lg opacity-50 animate-pulse"></div>
                                <Cpu className="w-12 h-12 text-amber-500 relative z-10 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-hero font-black text-white tracking-wider drop-shadow-lg glitch-text cursor-default">
                            SYSTEM <span className="text-red-600">ACCESS</span>
                        </h1>
                        <p className="text-amber-500/70 font-mono text-[10px] tracking-[0.4em] mt-1">SECURE PORT 443 // ECE NODE</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div className="space-y-1">
                            <div className="relative group">
                                <User className="absolute left-3 top-3 w-5 h-5 text-red-700 group-focus-within:text-amber-500 transition-colors" />
                                <input 
                                    type="text" 
                                    value={usernameInput}
                                    onChange={(e) => setUsernameInput(e.target.value)}
                                    placeholder="OPERATOR ID"
                                    className="w-full bg-black/40 border-b-2 border-red-900 text-white pl-10 py-3 font-hero font-bold tracking-widest placeholder-red-900/50 focus:outline-none focus:border-amber-500 transition-all uppercase"
                                />
                                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-amber-500 group-focus-within:w-full transition-all duration-500 shadow-[0_0_10px_#fbbf24]"></div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-red-700 group-focus-within:text-amber-500 transition-colors" />
                                <input 
                                    type="password" 
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="PASSKEY"
                                    className="w-full bg-black/40 border-b-2 border-red-900 text-white pl-10 py-3 font-hero font-bold tracking-widest placeholder-red-900/50 focus:outline-none focus:border-amber-500 transition-all"
                                />
                                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-amber-500 group-focus-within:w-full transition-all duration-500 shadow-[0_0_10px_#fbbf24]"></div>
                            </div>
                        </div>

                        {loginError && (
                            <div className="text-red-500 text-xs font-mono text-center bg-red-950/30 py-1 border border-red-900 animate-pulse">
                                [ERROR] {loginError}
                            </div>
                        )}

                        <button 
                            type="submit"
                            className="w-full bg-red-700 hover:bg-red-600 text-white font-hero font-black text-xl py-4 tracking-[0.2em] relative overflow-hidden group transition-all clip-path-slant shadow-[0_0_20px_rgba(185,28,28,0.4)] hover:shadow-[0_0_40px_rgba(251,191,36,0.6)]"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2 group-hover:scale-105 transition-transform">
                                {isDiving ? 'GRANTING ACCESS...' : 'INITIATE PROTOCOL'}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay"></div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                        </button>
                    </form>
                    
                    <div className="mt-6 flex justify-between items-end border-t border-red-900/30 pt-4">
                        <div className="flex gap-1">
                            <div className="w-1 h-4 bg-red-600 animate-pulse"></div>
                            <div className="w-1 h-3 bg-red-700"></div>
                            <div className="w-1 h-2 bg-red-800"></div>
                        </div>
                        <div className="text-[9px] text-red-500 font-mono text-right">
                             <div>SYS_INTEGRITY: 100%</div>
                             <div>ENCRYPTION: AES-256</div>
                        </div>
                    </div>
                </div>
             </div>
        </div>

        {isDiving && (
            <div className="absolute inset-0 z-50 bg-amber-500 mix-blend-multiply animate-[ping_0.5s_ease-out_forwards]"></div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#050505] text-slate-100 font-sans overflow-hidden">
      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap');
          .font-hero, h1, h2, h3, h4, .text-xl, .text-2xl, .text-4xl, .text-lg { font-family: 'Rajdhani', sans-serif; }
      `}</style>
      
      <video ref={hiddenVideoRef} muted autoPlay playsInline className="hidden pointer-events-none fixed" />

      {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-[#0f172a] border border-slate-700 rounded-lg p-6 w-96 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Wifi className="w-5 h-5 text-blue-500" /> 
                      Connection Settings
                  </h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-mono text-slate-400 mb-1">ESP32 IP ADDRESS</label>
                          <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={configIp}
                                onChange={(e) => setConfigIp(e.target.value)}
                                placeholder="192.168.1.X"
                                className="flex-1 bg-black/50 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                              />
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                             Use the IP shown in your ESP32 Serial Monitor.
                             Current: <span className="text-blue-400">{getEsp32Config().ip}</span>
                          </p>
                      </div>

                      <div className="pt-4 flex justify-end gap-2">
                          <button 
                            onClick={() => setIsSettingsOpen(false)}
                            className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                          >
                              Cancel
                          </button>
                          <button 
                            onClick={handleSaveConfig}
                            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
                          >
                              Save & Connect
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#0a0a0a] border-r border-slate-800 transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-blue-600 opacity-50"></div>
                <Activity className="text-white w-5 h-5 relative z-10" />
             </div>
             <h1 className="font-bold text-lg tracking-wide text-slate-100">Smart Fence <span className="text-blue-500">IQ</span></h1>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
             const Icon = item.icon;
             const isActive = currentView === item.id;
             return (
               <button
                 key={item.id}
                 onClick={() => {
                    setCurrentView(item.id);
                    setIsSidebarOpen(false);
                 }}
                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border
                    ${isActive 
                        ? 'bg-blue-600/10 text-blue-400 border-blue-600/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]' 
                        : 'text-slate-500 border-transparent hover:bg-slate-900 hover:text-slate-300 hover:border-slate-800'}
                 `}
               >
                 <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                 <span className="font-medium text-sm tracking-wide">{item.label}</span>
               </button>
             );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 space-y-3 bg-[#0a0a0a]">
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded text-slate-500 hover:bg-slate-900 hover:text-white transition-colors text-sm font-medium"
            >
                <Wifi className="w-4 h-4" />
                Connection Settings
            </button>
            
            <div className="flex items-center gap-3 px-4 py-2">
                <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${data.online ? 'bg-emerald-500 text-emerald-500' : 'bg-slate-600 text-slate-600'}`}></div>
                <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-mono">{data.online ? 'SYSTEM: ONLINE' : 'SYSTEM: OFFLINE'}</span>
                    <span className={`text-[10px] ${isCameraActive ? 'text-red-400 animate-pulse' : 'text-slate-700'}`}>
                        {isCameraActive ? '● REC ACTIVE' : '○ REC IDLE'}
                    </span>
                </div>
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#050505] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01),rgba(255,255,255,0.02))] bg-[length:100%_4px,6px_100%]">
        <header className="h-16 border-b border-slate-800 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-between px-6 lg:px-8 z-10">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 -ml-2 text-slate-400 hover:text-slate-100 lg:hidden"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-slate-100 uppercase tracking-widest text-shadow-glow">
                        {navItems.find(i => i.id === currentView)?.label}
                    </h2>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="w-10 h-10 rounded-sm bg-slate-900 border border-slate-700 hover:border-cyan-500 transition-all overflow-hidden flex items-center justify-center focus:outline-none relative"
                    >
                        {currentUser.avatar ? (
                            <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                        ) : (
                            <User className="w-5 h-5 text-slate-400" />
                        )}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-3 w-56 bg-[#0a0a0a] border border-slate-700 rounded-none shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-500"></div>
                            <div className="p-4 border-b border-slate-800">
                                <p className="text-[10px] text-cyan-600 uppercase tracking-wider mb-1">OPERATOR ID</p>
                                <p className="text-slate-200 font-bold font-mono text-lg">{currentUser.name}</p>
                            </div>
                            <div className="p-2">
                                <button 
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors font-mono uppercase tracking-wider"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>TERMINATE SESSION</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
            <div className="max-w-7xl mx-auto h-full">
                {renderView()}
            </div>
        </div>
      </main>
    </div>
  );
}
