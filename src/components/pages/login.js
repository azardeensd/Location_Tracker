//included CAPTCHA validation in login page//
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { api } from '../services/api';
import styles from './login.module.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const navigate = useNavigate();
  const recaptchaRef = useRef();

  // reCAPTCHA site key - Replace with your actual site key
  const RECAPTCHA_SITE_KEY = '6LfrPAAsAAAAAOwUphq0Le1tnPrYok4Iwi98evyO'; // This is a google captcha

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user starts typing
  };

  const handleCaptchaChange = (value) => {
    // Value will be null if captcha expires or user unchecks
    setCaptchaVerified(!!value);
    setError('');
  };

  const handleCaptchaError = () => {
    setError('CAPTCHA verification failed. Please try again.');
    setCaptchaVerified(false);
  };

  const handleCaptchaExpired = () => {
    setCaptchaVerified(false);
    recaptchaRef.current.reset();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    // CAPTCHA validation
    if (!captchaVerified) {
      setError('Please complete the CAPTCHA verification');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get the CAPTCHA token
      const captchaToken = await recaptchaRef.current.getValue();
      
      if (!captchaToken) {
        setError('CAPTCHA verification failed. Please try again.');
        setLoading(false);
        return;
      }

      // Prepare login data with CAPTCHA token
      const loginData = {
        ...formData,
        captchaToken: captchaToken
      };

      const { data, error } = await api.login(loginData);
      
      if (error) {
        setError(error.message || 'Login failed. Please try again.');
        // Reset CAPTCHA on error
        recaptchaRef.current.reset();
        setCaptchaVerified(false);
        return;
      }

      if (data && data.success) {
        // Store user session
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Redirect to driver page
        navigate('/driver');
      } else {
        setError('Invalid credentials');
        recaptchaRef.current.reset();
        setCaptchaVerified(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Login error:', err);
      // Reset CAPTCHA on error
      recaptchaRef.current.reset();
      setCaptchaVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: ''
    });
    setError('');
    setCaptchaVerified(false);
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.logoSection}>
            <h1 className={styles.logo}>🚛 Transporter Portal</h1>
            <p className={styles.subtitle}>Market Vehicle</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            {error && (
              <div className={styles.errorMessage}>
                ⚠️ Username or Password is incorrect
              </div>
            )}

            <div className={styles.formGroup}>
              {/* <label htmlFor="username" className={styles.label}>
                User Name
              </label> */}
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter your User name"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              {/* <label htmlFor="password" className={styles.label}>
                Password
              </label> */}
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            {/* CAPTCHA Component */}
            <div className={styles.captchaContainer}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaChange}
                onErrored={handleCaptchaError}
                onExpired={handleCaptchaExpired}
                size="normal"
                theme="light"
              />
            </div>

            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.loginButton}
                disabled={loading || !captchaVerified}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
              
              <button 
                type="button" 
                className={styles.resetButton}
                onClick={resetForm}
                disabled={loading}
              >
                Reset
              </button>
            </div>
          </form>

          <div className={styles.footer}>
            <p>Contact admin for login credentials</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

//old login page code//

// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { api } from '../services/api';
// import styles from './login.module.css';

// const Login = () => {
//   const [formData, setFormData] = useState({
//     username: '',
//     password: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//     setError(''); // Clear error when user starts typing
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!formData.username.trim() || !formData.password.trim()) {
//       setError('Please enter both username and password');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       const { data, error } = await api.login(formData);
      
//       if (error) {
//         setError(error.message || 'Login failed. Please try again.');
//         return;
//       }

//       if (data && data.success) {
//         // Store user session
//         localStorage.setItem('userToken', data.token);
//         localStorage.setItem('userData', JSON.stringify(data.user));
        
//         // Redirect to driver page
//         navigate('/driver');
//       } else {
//         setError('Invalid credentials');
//       }
//     } catch (err) {
//       setError('Network error. Please try again.');
//       console.error('Login error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className={styles.loginPage}>
//       <div className={styles.loginContainer}>
//         <div className={styles.loginCard}>
//           <div className={styles.logoSection}>
//             <h1 className={styles.logo}>🚛Transporter Portal</h1>
//             <p className={styles.subtitle}>Market Vehicle</p>
//           </div>

//           <form onSubmit={handleSubmit} className={styles.loginForm}>
//             {error && (
//               <div className={styles.errorMessage}>
//                 ⚠️ {error}
//               </div>
//             )}

//             <div className={styles.formGroup}>
//               <label htmlFor="username" className={styles.label}>
//                 User Name
//               </label>
//               <input
//                 type="text"
//                 id="username"
//                 name="username"
//                 value={formData.username}
//                 onChange={handleChange}
//                 className={styles.input}
//                 placeholder="Enter your User name"
//                 required
//                 disabled={loading}
//               />
//             </div>

//             <div className={styles.formGroup}>
//               <label htmlFor="password" className={styles.label}>
//                 Password
//               </label>
//               <input
//                 type="password"
//                 id="password"
//                 name="password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 className={styles.input}
//                 placeholder="Enter your password"
//                 required
//                 disabled={loading}
//               />
//             </div>

//             <button 
//               type="submit" 
//               className={styles.loginButton}
//               disabled={loading}
//             >
//               {loading ? 'Signing In...' : 'Sign In'}
//             </button>
//           </form>

//           <div className={styles.footer}>
//             <p>Contact admin for login credentials</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;
