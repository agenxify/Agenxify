import React, { useState, useEffect } from 'react';
import { X, Shield, Check, ChevronRight } from 'lucide-react';

type ConsentCategories = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
};

const defaultConsent: ConsentCategories = {
  essential: true, // Always true
  analytics: false,
  marketing: false,
  functional: false,
};

const COOKIE_CONSENT_KEY = 'agencyos_cookie_consent_v2';

export const getCookieConsent = (): ConsentCategories => {
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return defaultConsent;
    }
  }
  return defaultConsent;
};

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [consent, setConsent] = useState<ConsentCategories>(defaultConsent);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent);
        setConsent(parsed);
        setHasConsented(true);
        applyConsent(parsed);
      } catch (e) {
        console.error('Error parsing cookie consent:', e);
        setIsVisible(true);
      }
    } else {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for custom event to open preferences from footer or elsewhere
  useEffect(() => {
    const handleOpenPreferences = () => {
      const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (storedConsent) {
        try {
          setConsent(JSON.parse(storedConsent));
        } catch (e) {
          // ignore
        }
      }
      setShowPreferences(true);
      setIsVisible(true);
    };
    window.addEventListener('open_cookie_preferences', handleOpenPreferences);
    return () => window.removeEventListener('open_cookie_preferences', handleOpenPreferences);
  }, []);

  const applyConsent = (categories: ConsentCategories) => {
    // 1. Analytics Scripts
    if (categories.analytics) {
      // Example: Load Google Analytics
      // loadGoogleAnalytics('G-XXXXXXXXXX');
      console.log('Analytics cookies accepted. Loading analytics scripts...');
      window.dispatchEvent(new CustomEvent('consent_analytics_granted'));
    } else {
      console.log('Analytics cookies rejected. Blocking analytics scripts...');
      // Remove cookies if previously set (implementation depends on specific cookies)
    }

    // 2. Marketing Scripts
    if (categories.marketing) {
      // Example: Load Meta Pixel
      // loadMetaPixel('XXXXXXXXXXXXXXX');
      console.log('Marketing cookies accepted. Loading marketing scripts...');
      window.dispatchEvent(new CustomEvent('consent_marketing_granted'));
    }

    // 3. Functional Scripts
    if (categories.functional) {
      console.log('Functional cookies accepted.');
      window.dispatchEvent(new CustomEvent('consent_functional_granted'));
    }
  };

  const saveConsent = (newConsent: ConsentCategories) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);
    setHasConsented(true);
    setIsVisible(false);
    setShowPreferences(false);
    applyConsent(newConsent);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    });
  };

  const handleSavePreferences = () => {
    saveConsent(consent);
  };

  const toggleCategory = (category: keyof ConsentCategories) => {
    if (category === 'essential') return; // Cannot toggle essential
    setConsent(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (!isVisible && hasConsented && !showPreferences) return null;

  return (
    <>
      {/* Main Banner */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible && !showPreferences ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-4xl mx-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border border-slate-200/50 dark:border-zinc-800/50 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
              <Shield size={16} className="text-blue-600 dark:text-blue-400" />
              Privacy & Cookies
            </h3>
            <p className="text-[13px] text-slate-600 dark:text-zinc-400 leading-relaxed">
              We use cookies to improve your experience, analyze site traffic, and serve tailored content. By clicking "Accept All", you consent to our use of cookies. Read our <a href="#/privacy-policy" onClick={() => setIsVisible(false)} className="text-slate-900 dark:text-white underline decoration-slate-300 dark:decoration-zinc-600 underline-offset-2 hover:decoration-slate-900 dark:hover:decoration-white transition-colors">Privacy Policy</a> to learn more.
            </p>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full md:w-auto shrink-0">
            <button 
              onClick={() => setShowPreferences(true)}
              className="flex-1 sm:flex-none px-4 py-2 text-[13px] font-semibold text-slate-700 dark:text-zinc-300 bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors whitespace-nowrap"
            >
              Preferences
            </button>
            <button 
              onClick={handleRejectNonEssential}
              className="flex-1 sm:flex-none px-4 py-2 text-[13px] font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-colors whitespace-nowrap"
            >
              Reject All
            </button>
            <button 
              onClick={handleAcceptAll}
              className="flex-1 sm:flex-none px-4 py-2 text-[13px] font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl shadow-sm transition-all whitespace-nowrap"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-zinc-800/50 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Shield size={18} className="text-blue-600 dark:text-blue-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Privacy Preferences</h2>
              </div>
              <button 
                onClick={() => {
                  if (hasConsented) {
                    setShowPreferences(false);
                    setIsVisible(false);
                  } else {
                    setShowPreferences(false);
                    setIsVisible(true);
                  }
                }} 
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Close preferences"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <p className="text-[13px] text-slate-600 dark:text-zinc-400 mb-6 leading-relaxed">
                When you visit any website, it may store or retrieve information on your browser, mostly in the form of cookies. This information might be about you, your preferences or your device and is mostly used to make the site work as you expect it to.
              </p>

              <div className="space-y-3">
                {/* Essential Cookies */}
                <div className="p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-800/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">Strictly Necessary</h4>
                      <p className="text-[12px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        These cookies are essential for the website to function and cannot be switched off. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms.
                      </p>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">Always Active</span>
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800/60 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors cursor-pointer group" onClick={() => toggleCategory('analytics')}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">Analytics</h4>
                      <p className="text-[12px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.
                      </p>
                    </div>
                    <div className="shrink-0 pt-0.5 flex items-center justify-center p-2 -m-2">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${consent.analytics ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-zinc-600 group-hover:border-emerald-500/50'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform duration-200 ${consent.analytics ? 'scale-100' : 'scale-0'}`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800/60 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors cursor-pointer group" onClick={() => toggleCategory('marketing')}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">Marketing</h4>
                      <p className="text-[12px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.
                      </p>
                    </div>
                    <div className="shrink-0 pt-0.5 flex items-center justify-center p-2 -m-2">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${consent.marketing ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-zinc-600 group-hover:border-emerald-500/50'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform duration-200 ${consent.marketing ? 'scale-100' : 'scale-0'}`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800/60 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors cursor-pointer group" onClick={() => toggleCategory('functional')}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">Functional</h4>
                      <p className="text-[12px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        These cookies enable the website to provide enhanced functionality and personalisation. They may be set by us or by third party providers whose services we have added to our pages.
                      </p>
                    </div>
                    <div className="shrink-0 pt-0.5 flex items-center justify-center p-2 -m-2">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${consent.functional ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-zinc-600 group-hover:border-emerald-500/50'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform duration-200 ${consent.functional ? 'scale-100' : 'scale-0'}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex gap-4 text-[12px] font-medium text-slate-500 dark:text-zinc-400">
                <a href="#/privacy-policy" onClick={() => setShowPreferences(false)} className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
                <a href="#/cookie-policy" onClick={() => setShowPreferences(false)} className="hover:text-slate-900 dark:hover:text-white transition-colors">Cookie Policy</a>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleRejectNonEssential}
                  className="flex-1 sm:flex-none px-4 py-2 text-[13px] font-semibold text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  Reject All
                </button>
                <button 
                  onClick={handleSavePreferences}
                  className="flex-1 sm:flex-none px-4 py-2 text-[13px] font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl shadow-sm transition-all"
                >
                  Save Choices
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
