const EMAILJS_SERVICE_ID = 'service_jkkyn35';

const EMAILJS_TEMPLATE_ID = 'template_8rrztol'; 
const EMAILJS_PUBLIC_KEY = 'NdtWYz6AGmkCGaJsg';   

export async function sendOtpEmail(email, otp) {
  try {
    if (EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID') {
      return true; 
    }
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost', 
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: email,
          email: email, 
          otp: otp,
        },
      }),
    });
    if (response.ok) {
      return true;
    } else {
      const errorText = await response.text();
      return false;
    }
  } catch (error) {
    return false;
  }
}