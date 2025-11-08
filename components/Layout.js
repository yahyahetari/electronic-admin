import { useSession, signIn, signOut } from "next-auth/react";
import Nav from "./Nav";
import TopBar from "./TopBar";
import { useMediaQuery } from "react-responsive";
import Loader from "./Loader";
import React, { useEffect, useRef, useState } from "react";
import axios from 'axios';
import { useRouter } from "next/router";
import VerificationForm from "./VerificationForm";

export default function Layout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === "loading";
  const mainRef = useRef(null);
  const [activeTab, setActiveTab] = useState('login');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    signup_full_name: '',
    signup_email: '',
    signup_password: '',
    login_email: '',
    login_password: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  useEffect(() => {
    if (session?.user) {
      if (router.pathname === '/auth/signin') {
        router.push('/');
      }
      setIsVerified(!!session.user.isVerified);
    }
  }, [session, router]);

  const togglePasswordVisibility = (field) => {
    if (field === 'signup') {
      setShowSignupPassword(!showSignupPassword);
    } else if (field === 'login') {
      setShowLoginPassword(!showLoginPassword);
    }
  };

  const handleTabClick = (e, tab) => {
    e.preventDefault();
    setActiveTab(tab);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // التحقق من وجود المستخدم
  const checkUserExists = async (email) => {
    try {
      console.log('🔍 [Admin] Checking if user exists:', email);
      const response = await axios.get(`/api/user-verification-status?email=${encodeURIComponent(email.toLowerCase().trim())}`);
      console.log('✅ [Admin] Response:', response.data);
      return response.data.exists === true;
    } catch (error) {
      console.error('❌ [Admin] Error checking user existence:', error);
      return false;
    }
  };

  // التحقق من حالة التفعيل
  const checkUserVerificationStatus = async (email) => {
    try {
      console.log('🔍 [Admin] Checking verification status for:', email);
      const response = await axios.get(`/api/user-verification-status?email=${encodeURIComponent(email.toLowerCase().trim())}`);
      console.log('✅ [Admin] Verification response:', response.data);
      // التأكد من أن isVerified هو true بالضبط
      return response.data.isVerified === true;
    } catch (error) {
      console.error('❌ [Admin] Error checking verification:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (activeTab === 'signup') {
        if (formData.signup_full_name.length < 10) {
          setError('الاسم الكامل يجب أن يكون 10 أحرف على الأقل');
          return;
        }
        
        try {
          const response = await axios.post('/api/auth/signup', {
            name: formData.signup_full_name,
            email: formData.signup_email.toLowerCase().trim(),
            password: formData.signup_password
          });
          
          if (response.data.success) {
            console.log('✅ Signup successful, sending verification code...');
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setVerificationCode(code);
            await axios.post('/api/send-verification', { 
              email: formData.signup_email.toLowerCase().trim(), 
              code 
            });
            setShowVerification(true);
          }
        } catch (signupError) {
          if (signupError.response?.data?.error && 
              (signupError.response.data.error.includes('already exists') || 
               signupError.response.data.error.includes('موجود'))) {
            console.log('⚠️ [Admin] User exists, checking verification...');
            const isVerified = await checkUserVerificationStatus(formData.signup_email);
            
            if (!isVerified) {
              console.log('📧 [Admin] Not verified, sending code...');
              const code = Math.floor(100000 + Math.random() * 900000).toString();
              setVerificationCode(code);
              
              try {
                await axios.post('/api/send-verification', { 
                  email: formData.signup_email.toLowerCase().trim(), 
                  code 
                });
                setError('');
                setShowVerification(true);
              } catch (sendError) {
                setError('فشل إرسال رمز التحقق');
              }
            } else {
              console.log('✅ [Admin] Already verified, redirect to login');
              setError('هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول');
              setActiveTab('login');
              setFormData(prev => ({
                ...prev,
                login_email: formData.signup_email
              }));
            }
          } else {
            setError(signupError.response?.data?.error || 'فشل التسجيل');
          }
        }
      } else {
        // === تسجيل الدخول ===
        const loginEmail = formData.login_email.toLowerCase().trim();
        console.log('🔐 [Admin] Attempting login for:', loginEmail);
        
        // الخطوة 1: التحقق من وجود المستخدم
        const userExists = await checkUserExists(loginEmail);
        console.log('👤 [Admin] User exists?', userExists);
        
        if (!userExists) {
          console.log('⚠️ [Admin] User not found, redirect to signup');
          setError('هذا البريد الإلكتروني غير مسجل. يرجى إنشاء حساب جديد');
          setActiveTab('signup');
          setFormData(prev => ({
            ...prev,
            signup_email: loginEmail
          }));
          return;
        }
        
        // الخطوة 2: التحقق من حالة التفعيل قبل تسجيل الدخول
        const isAlreadyVerified = await checkUserVerificationStatus(loginEmail);
        console.log('✓ [Admin] Is user verified?', isAlreadyVerified);
        
        // الخطوة 3: محاولة تسجيل الدخول
        const result = await signIn("credentials", {
          redirect: false,
          email: loginEmail,
          password: formData.login_password,
        });
        
        console.log('📝 [Admin] Login result:', { ok: result?.ok, error: result?.error });
        
        if (result?.ok) {
          console.log('🎉 [Admin] Login successful!');
          
          // إذا كان المستخدم محقق، ادخل مباشرة
          if (isAlreadyVerified) {
            console.log('✅ [Admin] User is verified, redirecting to home...');
            setIsVerified(true);
            router.push('/');
            return;
          }
          
          // إذا لم يكن محقق، أرسل كود التحقق
          console.log('📧 [Admin] User not verified, sending verification code...');
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          setVerificationCode(code);
          
          try {
            await axios.post('/api/send-verification', { 
              email: loginEmail, 
              code 
            });
            console.log('✅ [Admin] Verification code sent');
            setShowVerification(true);
          } catch (sendError) {
            console.error('❌ [Admin] Failed to send verification code:', sendError);
            setError('فشل إرسال رمز التحقق');
          }
        } else {
          console.log('❌ [Admin] Login failed');
          setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }
      }
    } catch (error) {
      console.error('❌ [Admin] Submit error:', error);
      setError(error.response?.data?.error || 'حدث خطأ');
    }
  };

  const handleVerify = async (enteredCode) => {
    if (enteredCode === verificationCode) {
      try {
        const emailToVerify = (activeTab === 'signup' ? formData.signup_email : formData.login_email).toLowerCase().trim();
        
        console.log('✓ [Admin] Verifying user:', emailToVerify);
        
        // تحديث حالة التحقق في قاعدة البيانات
        await axios.post('/api/verify-user', { 
          email: emailToVerify 
        });
        
        console.log('✅ [Admin] User verified successfully');
        
        setIsVerified(true);
        
        // تسجيل الدخول مرة أخرى لتحديث الجلسة
        const passwordToUse = activeTab === 'signup' ? formData.signup_password : formData.login_password;
        await signIn("credentials", {
          redirect: false,
          email: emailToVerify,
          password: passwordToUse,
        });
        
        setTimeout(() => {
          router.push('/');
        }, 100);
      } catch (error) {
        console.error('❌ [Admin] Verification error:', error);
        setError('فشل في التحقق من المستخدم');
      }
    } else {
      setError('رمز التحقق غير صحيح');
    }
  };
  
  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const isMobileOrLess = useMediaQuery({ query: '(max-width: 815px)' });

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-bg-img bg-cover h-screen bg-glass">
        <Loader />
      </div>
    );
  }

  if (!session || (session && !isVerified)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-img bg-cover h-screen bg-glass overflow-y-hidden">
        <div className="w-full max-w-[600px] mx-auto my-5">
          <div className="bg-b-glass p-10 rounded-2xl shadow-[0_4px_10px_4px_rgba(19,35,47,3)]">
            {showVerification ? (
              <VerificationForm onVerify={handleVerify} correctCode={verificationCode} />
            ) : (
              <div className="form">
                <ul className="flex justify-between list-none p-0 mb-5">
                  <li className="flex-1 mx-1">
                    <a
                      href="#signup"
                      onClick={(e) => handleTabClick(e, 'signup')}
                      className={`block py-2.5 px-2.5 text-center text-xl cursor-pointer transition-all duration-500 ease-in-out rounded-2xl ${activeTab === 'signup'
                        ? 'bg-[#01939c] text-white'
                        : 'bg-[rgba(160,179,176,0.25)] text-[#a0b3b0] hover:bg-h-glass hover:text-white'
                        }`}
                    >
                      حساب جديد
                    </a>
                  </li>
                  <li className="flex-1 mx-1">
                    <a
                      href="#login"
                      onClick={(e) => handleTabClick(e, 'login')}
                      className={`block py-2.5 px-2.5 text-center text-xl cursor-pointer transition-all duration-500 ease-in-out rounded-2xl ${activeTab === 'login'
                        ? 'bg-[#01939c] text-white'
                        : 'bg-[rgba(160,179,176,0.25)] text-[#a0b3b0] hover:bg-h-glass hover:text-white'
                        }`}
                    >
                      تسجيل الدخول
                    </a>
                  </li>
                </ul>

                {error && <p className="text-red-500 text-xl text-center mb-4">{error}</p>}

                <div className="w-full">
                  <div id="signup" style={{ display: activeTab === 'signup' ? 'block' : 'none' }}>
                    <h1 className="text-center text-white font-light text-3xl mb-2.5">مرحباً</h1>
                    <form onSubmit={handleSubmit} autoComplete="off">
                      <div className="mb-4">
                        <input
                          type="text"
                          required
                          name="signup_full_name"
                          value={formData.signup_full_name}
                          onChange={handleInputChange}
                          className="text-lg w-full py-2.5 px-4 bg-transparent border border-[#01939c] text-white rounded-md transition-all duration-250 ease-in-out focus:outline-none focus:border-[#179b77]"
                          placeholder="الاسم الكامل"
                          autoComplete="new-full-name"
                        />
                      </div>
                      <div className="mb-2">
                        <input
                          type="email"
                          required
                          name="signup_email"
                          value={formData.signup_email}
                          onChange={handleInputChange}
                          className="text-lg w-full py-2.5 px-4 bg-transparent border border-[#01939c] text-white rounded-md transition-all duration-250 ease-in-out focus:outline-none focus:border-[#179b77]"
                          placeholder="البريد الإلكتروني"
                          autoComplete="new-email"
                        />
                      </div>
                      <div className="mb-8 relative">
                        <input
                          type={showSignupPassword ? "text" : "password"}
                          required
                          name="signup_password"
                          value={formData.signup_password}
                          onChange={handleInputChange}
                          className="text-lg w-full py-2.5 px-4 pr-12 bg-transparent border border-[#01939c] text-white rounded-md transition-all duration-250 ease-in-out focus:outline-none focus:border-[#179b77]"
                          placeholder="كلمة المرور"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('signup')}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#01939c] hover:text-[#179b77] transition-colors duration-200"
                        >
                          {showSignupPassword ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                              <line x1="2" y1="2" x2="22" y2="22"/>
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                      </div>
                      <button type="submit" className="w-full py-2.5 px-0 text-xl font-normal bg-[#01939c] text-white rounded-2xl cursor-pointer transition-all duration-500 ease-in-out hover:bg-[#179b77]">تسجيل</button>
                    </form>
                  </div>

                  <div id="login" style={{ display: activeTab === 'login' ? 'block' : 'none' }}>
                    <h1 className="text-center text-white font-light text-3xl mb-2.5">مرحباً بعودتك</h1>
                    <form onSubmit={handleSubmit} autoComplete="off">
                      <div className="mb-10">
                        <input
                          type="email"
                          required
                          name="login_email"
                          value={formData.login_email}
                          onChange={handleInputChange}
                          className="text-lg w-full py-2.5 px-4 bg-transparent border border-[#01939c] text-white rounded-md transition-all duration-250 ease-in-out focus:outline-none focus:border-[#179b77]"
                          placeholder="البريد الإلكتروني"
                          autoComplete="new-email"
                        />
                      </div>
                      <div className="mb-10 relative">
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          required
                          name="login_password"
                          value={formData.login_password}
                          onChange={handleInputChange}
                          className="text-lg w-full py-2.5 px-4 pr-12 bg-transparent border border-[#01939c] text-white rounded-md transition-all duration-250 ease-in-out focus:outline-none focus:border-[#179b77]"
                          placeholder="كلمة المرور"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('login')}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#01939c] hover:text-[#179b77] transition-colors duration-200"
                        >
                          {showLoginPassword ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                              <line x1="2" y1="2" x2="22" y2="22"/>
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                      </div>
                      <button type="submit" className="w-full py-2.5 px-0 text-xl font-normal bg-[#01939c] text-white rounded-2xl cursor-pointer transition-all duration-500 ease-in-out hover:bg-[#179b77]">تسجيل الدخول</button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white bg-bg-img bg-cover min-h-screen bg-glass overflow-hidden">
      {isMobileOrLess && <TopBar />}
      <div className="flex">
        {!isMobileOrLess && <Nav />}
        <main
          ref={mainRef}
          className={`flex-grow m-2 w-44 p-4 ${isMobileOrLess ? 'ml-2 h-[499px]' : 'mr-64'} rounded-lg bg-glass h-[600px] overflow-y-auto w-54 custom-scrollbar`}
        >
          {React.cloneElement(children, { scrollToTop })}
        </main>
      </div>
    </div>
  );
}