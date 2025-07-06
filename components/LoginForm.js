import React, { useState, useEffect } from 'react';

const LoginRegisterForm = () => {
  const [activeTab, setActiveTab] = useState('signup');
  const [formData, setFormData] = useState({
    signup_first_name: '',
    signup_last_name: '',
    signup_email: '',
    signup_password: '',
    login_email: '',
    login_password: ''
  });

  // استخدام useEffect لإعادة تعيين البيانات عند تحميل الصفحة
  useEffect(() => {
    setFormData({
      signup_first_name: '',
      signup_last_name: '',
      signup_email: '',
      signup_password: '',
      login_email: '',
      login_password: ''
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));

    const label = e.target.previousElementSibling;
    if (value !== '') {
      label.classList.add('active', 'highlight');
    } else {
      label.classList.remove('active', 'highlight');
    }
  };

  const handleInputBlur = (e) => {
    const label = e.target.previousElementSibling;
    if (e.target.value === '') {
      label.classList.remove('active', 'highlight');
    } else {
      label.classList.remove('highlight');
    }
  };

  const handleInputFocus = (e) => {
    const label = e.target.previousElementSibling;
    if (e.target.value === '') {
      label.classList.remove('highlight');
    } else {
      label.classList.add('highlight');
    }
  };

  const handleTabClick = (e, tab) => {
    e.preventDefault();
    setActiveTab(tab);
  };

  return (
    <div className="form" key={Date.now()}>
      <ul className="tab-group">
        <li className={`tab ${activeTab === 'signup' ? 'active' : ''}`}>
          <a href="#signup" onClick={(e) => handleTabClick(e, 'signup')}>Sign Up</a>
        </li>
        <li className={`tab ${activeTab === 'login' ? 'active' : ''}`}>
          <a href="#login" onClick={(e) => handleTabClick(e, 'login')}>Log In</a>
        </li>
      </ul>
      <div className="tab-content">
        <div id="signup" style={{display: activeTab === 'signup' ? 'block' : 'none'}}>
          <h1>Register</h1>
          <form action="/" method="post" autoComplete="off">
            <div className="top-row">
              <div className="field-wrap">
                <label>First Name</label>
                <input 
                  type="text" 
                  required 
                  name="signup_first_name" 
                  value={formData.signup_first_name}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
              </div>
              <div className="field-wrap">
                <label>Last Name</label>
                <input 
                  type="text" 
                  required 
                  name="signup_last_name" 
                  value={formData.signup_last_name}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
              </div>
            </div>
            <div className="field-wrap">
              <label>Email Address</label>
              <input 
                type="text" 
                required 
                name="signup_email" 
                value={formData.signup_email}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onFocus={handleInputFocus}
              />
            </div>
            <div className="field-wrap">
              <label>Password</label>
              <input 
                type="password" 
                required 
                name="signup_password" 
                value={formData.signup_password}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onFocus={handleInputFocus}
              />
            </div>
            <button type="submit" className="button button-block">Sign Up</button>
          </form>
        </div>
        <div id="login" style={{display: activeTab === 'login' ? 'block' : 'none'}}>
          <h1>Welcome Back!</h1>
          <form action="/" method="post" autoComplete="off">
            <div className="field-wrap">
              <label>Email</label>
              <input 
                type="text" 
                required 
                name="login_email" 
                value={formData.login_email}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onFocus={handleInputFocus}
              />
            </div>
            <div className="field-wrap">
              <label>Password</label>
              <input 
                type="password" 
                required 
                name="login_password" 
                value={formData.login_password}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onFocus={handleInputFocus}
              />
            </div>
            <button className="button button-block">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginRegisterForm;
