
import React, { useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';

const { useNavigate } = ReactRouterDom as any;

const MarketingDirectMail: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/marketing/email');
  }, [navigate]);
  return <div className="p-10 text-center text-white">Redirecting to integrated module...</div>;
};

export default MarketingDirectMail;
