export const NO_REPLY_EMAIL = `noreply@${process.env.DOMAIN_NAME}`;
// Self-hosted installs without a verified sending domain can point this at
// e.g. onboarding@resend.dev via MAIL_FROM.
export const SENDER_EMAIL =
  process.env.MAIL_FROM || `contact@${process.env.DOMAIN_NAME}`;
