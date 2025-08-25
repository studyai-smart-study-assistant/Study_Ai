
import { init, send } from 'emailjs-com';

// Initialize EmailJS with your user ID (public key)
export const initEmailJS = () => {
  init('rOb0aFIHqSNRXhqDz'); // Your EmailJS public key
};

// Send email function
export const sendEmail = (templateId: string, templateParams: any) => {
  return send('default_service', templateId, templateParams);
};
