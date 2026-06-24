import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Building2, 
  Smartphone, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronRight, 
  MapPin, 
  Lock, 
  Sparkles,
  Loader2 
} from 'lucide-react';

interface AuthFlowProps {
  onAuthSuccess: (user: { name: string; ward: string; role: string; points: number; badges: string[]; department?: string }) => void;
  onClose: () => void;
  initialRole?: 'citizen' | 'official' | null;
}

const BHUBANESWAR_WARDS = [
  "Ward 1 Saheed Nagar",
  "Ward 2 Patia",
  "Ward 3 Nayapalli",
  "Ward 4 Khandagiri",
  "Ward 5 Chandrasekharpur",
  "Ward 6 Damana",
  "Ward 7 Baramunda",
  "Ward 8 Rasulgarh",
  "Ward 9 Old Town",
  "Ward 10 Laxmisagar"
];

const AUTHORITY_DEPARTMENTS = [
  "Public Works Dept (PWD)",
  "Water & Sewerage Board",
  "Municipal Corporation",
  "Electricity Board",
  "Urban Planning"
];

export default function AuthFlow({ onAuthSuccess, onClose, initialRole = null }: AuthFlowProps) {
  const [step, setStep] = useState<'role_selection' | 'citizen_auth' | 'official_auth'>('role_selection');
  const [isSignUp, setIsSignUp] = useState<boolean>(true); // true for signup, false for login
  
  // Citizen state
  const [name, setName] = useState('');
  const [ward, setWard] = useState(BHUBANESWAR_WARDS[0]);
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Official state
  const [officialId, setOfficialId] = useState('');
  const [officialDepartment, setOfficialDepartment] = useState(AUTHORITY_DEPARTMENTS[0]);
  const [officialPassword, setOfficialPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // If initialRole is specified, skip step 1
  useEffect(() => {
    if (initialRole === 'citizen') {
      setStep('citizen_auth');
    } else if (initialRole === 'official') {
      setStep('official_auth');
    }
  }, [initialRole]);

  // Handle Send OTP with 2 second auto-fill simulation
  const handleSendOtp = () => {
    if (!mobile || mobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    setErrorMsg('');
    setOtpLoading(true);
    
    setTimeout(() => {
      setOtpLoading(false);
      setOtpSent(true);
      setToastMsg('OTP sent successfully to +91 ' + mobile + '! 📱');
      
      // Auto-fill "123456" after 2 seconds
      setTimeout(() => {
        setOtpCode('123456');
        setToastMsg('OTP auto-filled for developer convenience! ✨');
      }, 1500);
    }, 1000);
  };

  // Handle Citizen signup or login submission
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== '123456') {
      setErrorMsg('Invalid OTP. Please enter 123456.');
      return;
    }

    if (isSignUp && !name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }

    setErrorMsg('');
    setIsVerifying(true);
    
    // Simulate 1.2 second network check
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Simulate lookup of user if login, or creation if signup
    let finalName = name;
    let finalWard = ward;

    if (!isSignUp) {
      // Return user if already stored, or mock a name
      const stored = localStorage.getItem(`civic_user_${mobile}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          finalName = parsed.name;
          finalWard = parsed.ward;
        } catch (err) {
          finalName = 'Returning Citizen';
        }
      } else {
        finalName = 'Returning Citizen';
      }
    }

    const citizenUser = {
      name: finalName,
      ward: finalWard,
      role: 'citizen',
      points: 0,
      badges: []
    };

    // Store in localStorage
    localStorage.setItem(`civic_user_${mobile}`, JSON.stringify(citizenUser));
    localStorage.setItem('civic_current_user', JSON.stringify(citizenUser));

    setIsVerifying(false);
    onAuthSuccess(citizenUser);
  };

  // Handle Official credentials submission
  const handleOfficialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialId.trim()) {
      setErrorMsg('Please enter your Employee ID');
      return;
    }
    
    setErrorMsg('');
    setIsLoggingIn(true);

    // Simulate 1.2 seconds authority credential check
    await new Promise(resolve => setTimeout(resolve, 1200));

    const deptShort = officialDepartment.includes('(') 
      ? officialDepartment.match(/\(([^)]+)\)/)?.[1] 
      : officialDepartment;
    
    const officialUser = {
      name: 'Officer ' + deptShort,
      role: 'authority',
      department: officialDepartment,
      ward: 'All Wards (Bhubaneswar Municipal Corporation)',
      points: 100,
      badges: ['Officer Badge']
    };

    localStorage.setItem('civic_current_user', JSON.stringify(officialUser));
    setIsLoggingIn(false);
    onAuthSuccess(officialUser);
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      
      {/* Toast Alert message */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="absolute top-6 left-4 right-4 bg-[#e8f0fe] text-[#1a73e8] text-xs font-bold py-3 px-4 rounded-2xl shadow-xl z-50 flex items-center justify-between border border-blue-200"
          >
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg('')} className="text-blue-500 font-bold ml-2">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        className="bg-white rounded-[32px] overflow-hidden w-full max-w-xs shadow-2xl relative flex flex-col justify-between border border-gray-100"
        style={{ minHeight: "480px" }}
      >
        {/* Step Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 space-y-1 relative shrink-0">
          {step !== 'role_selection' && (
            <button 
              onClick={() => {
                setErrorMsg('');
                setOtpSent(false);
                setStep('role_selection');
              }}
              className="absolute left-4 top-5 text-white/80 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="absolute right-4 top-5 text-white/80 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition text-xs font-bold px-2 py-0.5"
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-1 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full w-fit">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
            <span className="text-[8px] font-black uppercase tracking-wider text-blue-100">Secure Access Portal</span>
          </div>
          <h3 className="text-base font-black tracking-tight pt-1">
            {step === 'role_selection' && "Welcome to CivicAI"}
            {step === 'citizen_auth' && (isSignUp ? "Citizen Registration" : "Citizen Sign In")}
            {step === 'official_auth' && "Official Credentials"}
          </h3>
          <p className="text-[10px] text-blue-100 font-medium">
            {step === 'role_selection' && "Select your access mode to get started"}
            {step === 'citizen_auth' && "Verify via instant 6-digit mock OTP"}
            {step === 'official_auth' && "Bhubaneswar Municipal Corporation portal"}
          </p>
        </div>

        {/* Content Box */}
        <div className="p-5 flex-1 flex flex-col justify-center overflow-y-auto">
          {step === 'role_selection' && (
            <div className="space-y-4">
              <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-wide pb-1">
                Are you a citizen or a government official?
              </p>

              {/* Citizen Card Option */}
              <button
                onClick={() => setStep('citizen_auth')}
                id="btn-role-citizen"
                className="w-full text-left bg-white hover:bg-blue-50/40 p-4 rounded-2xl border-2 border-blue-100 hover:border-blue-500 transition-all duration-150 flex items-center space-x-4 shadow-3xs cursor-pointer active:scale-98 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1a73e8] flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-[#1a73e8] group-hover:text-white transition">
                  <User className="w-6 h-6 stroke-[2.5px]" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-black text-gray-950 uppercase tracking-tight flex items-center justify-between">
                    <span>I'm a Citizen</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#1a73e8] transition" />
                  </h4>
                  <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                    Report potholes, streetlights, and earn badges for your ward.
                  </p>
                </div>
              </button>

              {/* Authority Card Option */}
              <button
                onClick={() => setStep('official_auth')}
                id="btn-role-official"
                className="w-full text-left bg-white hover:bg-indigo-50/40 p-4 rounded-2xl border-2 border-gray-150 hover:border-indigo-500 transition-all duration-150 flex items-center space-x-4 shadow-3xs cursor-pointer active:scale-98 group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100 group-hover:bg-indigo-700 group-hover:text-white transition">
                  <Building2 className="w-6 h-6 stroke-[2.5px]" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-black text-gray-950 uppercase tracking-tight flex items-center justify-between">
                    <span>I'm from Government</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-700 transition" />
                  </h4>
                  <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                    Review community audit telemetry, assign SLA tickets, and post resolution updates.
                  </p>
                </div>
              </button>
            </div>
          )}

          {step === 'citizen_auth' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl text-[10px] font-bold border border-rose-200">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Toggle Login/Signup inside */}
              <div className="flex justify-center bg-gray-50 p-1 rounded-xl border border-gray-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    isSignUp ? 'bg-[#1a73e8] text-white shadow-3xs' : 'text-gray-500'
                  }`}
                >
                  New Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    !isSignUp ? 'bg-[#1a73e8] text-white shadow-3xs' : 'text-gray-500'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {/* Form Input fields */}
              <div className="space-y-3">
                {isSignUp && (
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Priyabrata Mohanty" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-950 focus:outline-none focus:border-[#1a73e8] focus:bg-white transition"
                    />
                  </div>
                )}

                {isSignUp && (
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest">Primary Ward</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-blue-500" />
                      <select
                        value={ward}
                        onChange={(e) => setWard(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold text-gray-950 focus:outline-none focus:border-[#1a73e8] focus:bg-white transition appearance-none cursor-pointer"
                      >
                        {BHUBANESWAR_WARDS.map((w, i) => (
                          <option key={i} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-xs font-bold text-gray-400">+91</span>
                    <input 
                      type="tel" 
                      maxLength={10}
                      placeholder="Enter 10-digit mobile" 
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-3 py-2.5 text-xs font-bold text-gray-950 focus:outline-none focus:border-[#1a73e8] focus:bg-white transition"
                    />
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-1 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest">Enter 6-Digit OTP</label>
                      <span className="text-[8px] text-emerald-600 font-extrabold uppercase">Auto-fills in 1.5s</span>
                    </div>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-emerald-500" />
                      <input 
                        type="password" 
                        maxLength={6}
                        placeholder="Type OTP 123456" 
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold text-gray-950 focus:outline-none focus:border-emerald-500 focus:bg-white tracking-widest text-center transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading || !mobile}
                    className="w-full bg-[#1a73e8] hover:bg-blue-700 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {otpLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Send Mock OTP</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center space-x-1 disabled:opacity-55"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying OTP...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isSignUp ? "Verify & Join CivicAI" : "Verify & Enter"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          )}

          {step === 'official_auth' && (
            <form onSubmit={handleOfficialLogin} className="space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl text-[10px] font-bold border border-rose-200">
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest">Employee ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. PWD-2025-001" 
                    value={officialId}
                    onChange={(e) => setOfficialId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-950 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest">Department</label>
                  <select
                    value={officialDepartment}
                    onChange={(e) => setOfficialDepartment(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-950 focus:outline-none focus:border-indigo-600 focus:bg-white transition cursor-pointer appearance-none"
                  >
                    {AUTHORITY_DEPARTMENTS.map((dept, index) => (
                      <option key={index} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest">Password</label>
                    <span className="text-[8px] text-gray-400 font-bold italic">Mock: Any password</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={officialPassword}
                      onChange={(e) => setOfficialPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold text-gray-950 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center space-x-1 disabled:opacity-55"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Login as Authority</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Info Footnote */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-[8px] text-gray-400 font-bold uppercase tracking-wider shrink-0">
          🔑 OTP is securely sandboxed for preview
        </div>

      </motion.div>
    </div>
  );
}
