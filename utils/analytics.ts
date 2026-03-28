// This file demonstrates how to load tracking scripts dynamically based on user consent.
// You can import this file in your main entry point (e.g., App.tsx or index.tsx) to initialize the listeners.

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const initAnalytics = () => {
  // Listen for Cookie Consent Updates
  window.addEventListener('cookie_consent_updated', (e: Event) => {
    const customEvent = e as CustomEvent;
    const consent = customEvent.detail;

    console.log('Updating Google Consent Mode...', consent);

    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        'analytics_storage': consent.analytics ? 'granted' : 'denied',
        'ad_storage': consent.marketing ? 'granted' : 'denied',
        'ad_user_data': consent.marketing ? 'granted' : 'denied',
        'ad_personalization': consent.marketing ? 'granted' : 'denied',
      });
    }

    if (consent.marketing) {
      console.log('Initializing Meta Pixel...');
      // Replace 'XXXXXXXXXXXXXXX' with your actual Meta Pixel ID
      loadMetaPixel('XXXXXXXXXXXXXXX');
    }

    if (consent.functional) {
      console.log('Initializing Functional Scripts...');
      // Load your functional scripts here (e.g., Intercom, Zendesk, etc.)
    }
  });
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
