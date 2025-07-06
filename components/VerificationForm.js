import React, { useState, useRef } from 'react';

const VerificationForm = ({ onVerify, correctCode }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    setError('');

    if (pastedData.length === 6) {
      inputRefs.current[5].focus();
    } else {
      inputRefs.current[pastedData.length].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const enteredCode = code.join('');
    
    if (enteredCode.length !== 6) {
      setError('الرجاء إدخال رمز التحقق المكون من 6 أرقام');
    } else if (!/^\d+$/.test(enteredCode)) {
      setError('الرجاء إدخال أرقام فقط');
    } else if (code.every(digit => digit === '')) {
      setError('جميع الخانات فارغة، الرجاء إدخال الرمز');
    } else if (code.some(digit => digit === '')) {
      setError('بعض الخانات فارغة، الرجاء إكمال الرمز');
    } else if (enteredCode !== correctCode) {
      setError('الرمز الذي أدخلته غير صحيح، الرجاء المحاولة مرة أخرى');
    } else {
      onVerify(enteredCode);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center">
      <h2 className="text-white text-2xl mb-4">أدخل رمز التحقق</h2>
        {error && <p className="text-red-500 text-xl mb-4">{error}</p>}
      <div className="flex justify-center mb-4">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            id={`code-${index}`}
            type="text"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onPaste={handlePaste}
            className="w-12 h-12 mx-1 text-2xl text-center border-2 border-[#01939c] rounded-md bg-transparent text-white"
          />
        ))}
      </div>
      <button
        type="submit"
        className="w-full py-2.5 px-0 text-xl font-normal bg-[#01939c] text-white rounded-2xl cursor-pointer transition-all duration-500 ease-in-out hover:bg-[#179b77]"
      >
        تحقق
      </button>
    </form>
  );
};

export default VerificationForm;
