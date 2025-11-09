/* eslint-disable no-undef */
import webpush from 'web-push';

const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;

if (!PUBLIC || !PRIVATE) {
  console.warn('VAPID keys are not set. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.');
}

webpush.setVapidDetails('mailto:support@yourdomain.com', PUBLIC, PRIVATE);

export default webpush;