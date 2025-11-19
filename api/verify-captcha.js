// api/verify-captcha.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Missing CAPTCHA token' });
    }

    // Verify with Google reCAPTCHA or hCaptcha (replace SITE_SECRET with your actual key)
    const secretKey = "6LfrPAAsAAAAAG3jD43DtudSzyB-IBC92mQsqHHu";

    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      { method: 'POST' }
    );

    const data = await response.json();
    if (data.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ success: false, message: 'CAPTCHA failed', data });
    }
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
