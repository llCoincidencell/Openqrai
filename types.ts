
export enum QRType {
  URL = 'URL',
  TEXT = 'TEXT',
  WIFI = 'WIFI',
  VCARD = 'VCARD',
  EMAIL = 'EMAIL',
  DIGITAL_CARD = 'DIGITAL_CARD'
}

export interface DigitalCardButton {
  id: string;
  label: string;
  url: string;
  btnType: 'web' | 'phone' | 'email';
}

export interface QRData {
  type: QRType;
  value: string; // The raw string to encode
  // Metadata for specific forms
  url?: string;
  text?: string;
  wifi?: {
    ssid: string;
    password: string;
    encryption: 'WPA/WPA2' | 'WEP' | 'nopass';
    hidden: boolean;
  };
  vcard?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    website: string;
    company: string;
    jobTitle: string;
    bio: string; // AI generated field
  };
  email?: {
    address: string;
    subject: string;
    body: string;
  };
  digitalCard?: {
    profileImage?: string;
    splashImage?: string;
    themeColor: string;
    name: string;
    jobTitle: string;
    company: string;
    bio: string;
    buttons: DigitalCardButton[];
    hostedUrl?: string; // Where the user uploaded the HTML
  };
}

export interface QRStyle {
  fgColor: string;
  bgColor: string;
  logoUrl?: string;
  logoSize: number; // Percentage of QR size
  includeMargin: boolean;
  eyeRadius: number; // 0 to 10ish usually implies square to round
}

export const DEFAULT_QR_STYLE: QRStyle = {
  fgColor: '#000000',
  bgColor: '#ffffff',
  logoSize: 20,
  includeMargin: true,
  eyeRadius: 0,
};

export const DEFAULT_QR_DATA: QRData = {
  type: QRType.URL,
  value: 'https://google.com',
  url: 'https://google.com',
  wifi: {
    ssid: '',
    password: '',
    encryption: 'WPA/WPA2',
    hidden: false
  },
  vcard: {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    website: '',
    company: '',
    jobTitle: '',
    bio: ''
  },
  email: {
    address: '',
    subject: '',
    body: ''
  },
  digitalCard: {
    themeColor: '#2563eb',
    name: '',
    jobTitle: '',
    company: '',
    bio: '',
    buttons: []
  }
};
