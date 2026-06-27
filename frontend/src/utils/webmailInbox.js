const WEBMAIL_INBOX_BY_DOMAIN = {
  'gmail.com': 'https://mail.google.com/mail/u/0/#inbox',
  'googlemail.com': 'https://mail.google.com/mail/u/0/#inbox',
  'outlook.com': 'https://outlook.live.com/mail/0/inbox',
  'hotmail.com': 'https://outlook.live.com/mail/0/inbox',
  'live.com': 'https://outlook.live.com/mail/0/inbox',
  'msn.com': 'https://outlook.live.com/mail/0/inbox',
  'yahoo.com': 'https://mail.yahoo.com/d/folders/1',
  'ymail.com': 'https://mail.yahoo.com/d/folders/1',
  'rocketmail.com': 'https://mail.yahoo.com/d/folders/1',
  'icloud.com': 'https://www.icloud.com/mail',
  'me.com': 'https://www.icloud.com/mail',
  'mac.com': 'https://www.icloud.com/mail',
  'proton.me': 'https://mail.proton.me/inbox',
  'protonmail.com': 'https://mail.proton.me/inbox',
  'zoho.com': 'https://mail.zoho.com/zm/#mail/folder/inbox',
  'aol.com': 'https://mail.aol.com/webmail-std/en-us/suite',
};

/** Webmail inbox URL for the customer's email domain, if recognized */
export const getWebmailInboxUrl = (email = '') => {
  const normalized = String(email).trim().toLowerCase();
  const at = normalized.lastIndexOf('@');
  if (at === -1) return null;

  const domain = normalized.slice(at + 1);
  return WEBMAIL_INBOX_BY_DOMAIN[domain] || null;
};
