// This file demonstrates how to load tracking scripts dynamically based on user consent.
// You can import this file in your main entry point (e.g., App.tsx or index.tsx) to initialize the listeners.

export const initAnalytics = () => {
  // Listen for Analytics Consent
  window.addEventListener('consent_analytics_granted', () => {
    console.log('Initializing Google Analytics and GTM...');
    loadGoogleAnalytics('G-56HN5BBTG0');
    loadGoogleTagManager('GTM-KPSGCBV8');
  });

  // Listen for Marketing Consent
  window.addEventListener('consent_marketing_granted', () => {
    console.log('Initializing Meta Pixel...');
    // Replace 'XXXXXXXXXXXXXXX' with your actual Meta Pixel ID
    loadMetaPixel('XXXXXXXXXXXXXXX');
  });

  // Listen for Functional Consent
  window.addEventListener('consent_functional_granted', () => {
    console.log('Initializing Functional Scripts...');
    // Load your functional scripts here (e.g., Intercom, Zendesk, etc.)
  });
};

// Helper function to load Google Analytics
const loadGoogleAnalytics = (measurementId: string) => {
  if (document.getElementById('ga-script')) return; // Prevent duplicate loading

  const script = document.createElement('script');
  script.id = 'ga-script';
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  const inlineScript = document.createElement('script');
  inlineScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(inlineScript);
};

// Helper function to load Google Tag Manager
const loadGoogleTagManager = (gtmId: string) => {
  if (document.getElementById('gtm-script')) return; // Prevent duplicate loading

  const script = document.createElement('script');
  script.id = 'gtm-script';
  script.innerHTML = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');
  `;
  document.head.appendChild(script);
};

// Helper function to load Meta Pixel
const loadMetaPixel = (pixelId: string) => {
  if (document.getElementById('meta-pixel-script')) return; // Prevent duplicate loading

  const script = document.createElement('script');
  script.id = 'meta-pixel-script';
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);
};
