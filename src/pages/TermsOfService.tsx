import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto mb-8">
        <button 
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Login
        </button>
      </div>
      <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert prose-headings:font-bold prose-h1:text-4xl prose-h1:mb-2 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-slate-600 dark:prose-p:text-zinc-400 prose-p:leading-relaxed prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-500 prose-li:text-slate-600 dark:prose-li:text-zinc-400">
        <h1>Terms of Service</h1>
        <p className="text-lg font-normal text-slate-500 dark:text-zinc-500 block mt-2">Last Updated On 25-Mar-2026</p>
        
        <p className="mt-8">
          Welcome to Agenxify. By using our services, you agree to be bound by the following terms and conditions. Please read them carefully.
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Agenxify platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          Agenxify provides a comprehensive agency management platform featuring CRM, project tracking, financial analytics, and business intelligence tools.
        </p>

        <h2>3. User Accounts</h2>
        <p>
          To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
        </p>

        <h2>4. Use of Service</h2>
        <p>
          You agree to use the service only for lawful purposes and in accordance with these terms. You are prohibited from violating or attempting to violate the security of the service.
        </p>

        <h2>5. Intellectual Property</h2>
        <p>
          All content, features, and functionality of the service are the exclusive property of Agenxify and its licensors.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          Agenxify shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
        </p>

        <h2>7. Termination</h2>
        <p>
          We reserve the right to terminate or suspend your account and access to the service at our sole discretion, without notice, for conduct that we believe violates these terms.
        </p>

        <h2>8. Governing Law</h2>
        <p>
          These terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
        </p>

        <h2>9. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new terms on this page.
        </p>

        <h2>10. Contact Us</h2>
        <p>
          If you have any questions about these Terms of Service, please contact us at contact@agenxify.com.
        </p>
      </div>
    </div>
  );
};
