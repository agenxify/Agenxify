import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto mb-8">
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>
      <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert prose-headings:font-bold prose-h1:text-4xl prose-h1:mb-2 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-slate-600 dark:prose-p:text-zinc-400 prose-p:leading-relaxed prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-500 prose-li:text-slate-600 dark:prose-li:text-zinc-400">
        <h1 className="privacy-policy-h1">
          Privacy Policy
          <br />
          <span className="text-lg font-normal text-slate-500 dark:text-zinc-500 block mt-2">Last Updated On 25-Mar-2026</span>
          <span className="text-lg font-normal text-slate-500 dark:text-zinc-500 block">Effective Date 26-Mar-2026</span>
        </h1>

        <p className="privacy-policy-p mt-8">
          This Privacy Policy describes the policies of Agenxify, 39, West Bengal 700009, India, email: contact@agenxify.com, phone: 07439464625 on the collection, use and disclosure of your information that we collect when you use our website ( https://www.agenxify.com ). (the "Service"). By accessing or using the Service, you are consenting to the collection, use and disclosure of your information in accordance with this Privacy Policy. If you do not consent to the same, please do not access or use the Service.
        </p>

        <p className="privacy-policy-p">
          We may modify this Privacy Policy at any time without any prior notice to you and will post the revised Privacy Policy on the Service. The revised Policy will be effective 180 days from when the revised Policy is posted in the Service and your continued access or use of the Service after such time will constitute your acceptance of the revised Privacy Policy. We therefore recommend that you periodically review this page.
        </p>

        <ol className="privacy-policy-ol list-decimal pl-5 space-y-8 mt-8">
          <li>
            <h2 className="privacy-policy-h2">Information We Collect:</h2>
            <p className="privacy-policy-p">
              We will collect and process the following personal information about you:
            </p>
            <ol className="privacy-policy-ol list-disc pl-5 mt-4 space-y-2">
              <li>Name</li>
              <li>Email</li>
              <li>Mobile</li>
              <li>Address</li>
              <li>Work Address</li>
              <li>Payment Info</li>
            </ol>
          </li>

          <li>
            <h2 className="privacy-policy-h2">How We Use Your Information:</h2>
            <p className="privacy-policy-p">
              We will use the information that we collect about you for the following purposes:
            </p>
            <ol className="privacy-policy-ol list-disc pl-5 mt-4 space-y-2">
              <li>Creating user account</li>
              <li>Customer feedback collection</li>
              <li>Processing payment</li>
              <li>Support</li>
              <li>Administration info</li>
              <li>Manage customer order</li>
              <li>Dispute resolution</li>
              <li>Manage user account</li>
            </ol>
            <p className="privacy-policy-p mt-4">
              If we want to use your information for any other purpose, we will ask you for consent and will use your information only on receiving your consent and then, only for the purpose(s) for which grant consent unless we are required to do otherwise by law.
            </p>
          </li>

          <li>
            <h2 className="privacy-policy-h2">Retention Of Your Information:</h2>
            <p className="privacy-policy-p">
              We will retain your personal information with us for 90 days to 2 years after users terminate their accounts or for as long as we need it to fulfill the purposes for which it was collected as detailed in this Privacy Policy. We may need to retain certain information for longer periods such as record-keeping / reporting in accordance with applicable law or for other legitimate reasons like enforcement of legal rights, fraud prevention, etc. Residual anonymous information and aggregate information, neither of which identifies you (directly or indirectly), may be stored indefinitely.
            </p>
          </li>

          <li>
            <h2 className="privacy-policy-h2">Your Rights:</h2>
            <p className="privacy-policy-p">
              Depending on the law that applies, you may have a right to access and rectify or erase your personal data or receive a copy of your personal data, restrict or object to the active processing of your data, ask us to share (port) your personal information to another entity, withdraw any consent you provided to us to process your data, a right to lodge a complaint with a statutory authority and such other rights as may be relevant under applicable laws. To exercise these rights, you can write to us at contactagencyos@gmai.com. We will respond to your request in accordance with applicable law.
            </p>
            <p className="privacy-policy-p mt-4">
              Do note that if you do not allow us to collect or process the required personal information or withdraw the consent to process the same for the required purposes, you may not be able to access or use the services for which your information was sought.
            </p>
          </li>

          <li>
            <h2 className="privacy-policy-h2">Cookies Etc.</h2>
            <p className="privacy-policy-p">
              To learn more about how we use these and your choices in relation to these tracking technologies, please refer to our <a href="#/cookie-policy">Cookie Policy</a>.
            </p>
          </li>

          <li>
            <h2 className="privacy-policy-h2">Security:</h2>
            <p className="privacy-policy-p">
              The security of your information is important to us and we will use reasonable security measures to prevent the loss, misuse or unauthorized alteration of your information under our control. However, given the inherent risks, we cannot guarantee absolute security and consequently, we cannot ensure or warrant the security of any information you transmit to us and you do so at your own risk.
            </p>
          </li>

          <li>
            <h2 className="privacy-policy-h2">Third Party Links & Use Of Your Information:</h2>
            <p className="privacy-policy-p">
              Our Service may contain links to other websites that are not operated by us. This Privacy Policy does not address the privacy policy and other practices of any third parties, including any third party operating any website or service that may be accessible via a link on the Service. We strongly advise you to review the privacy policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.
            </p>
          </li>

          <li>
            <h2 className="privacy-policy-h2">Grievance / Data Protection Officer:</h2>
            <p className="privacy-policy-p">
              If you have any queries or concerns about the processing of your information that is available with us, you may email our Grievance Officer at Agencify, 39, email: contact@agenxify.com. We will address your concerns in accordance with applicable law.
            </p>
          </li>
        </ol>
      </div>
    </div>
  );
};
