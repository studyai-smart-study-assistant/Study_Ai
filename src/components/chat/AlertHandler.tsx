
import React from 'react';
import MessageLimitAlert from '../MessageLimitAlert';

interface AlertHandlerProps {
  showLimitAlert: boolean;
  onClose: () => void;
}

const AlertHandler: React.FC<AlertHandlerProps> = ({ 
  showLimitAlert, 
  onClose 
}) => {
  if (!showLimitAlert) return null;
  
  return <MessageLimitAlert onClose={onClose} />;
};

export default AlertHandler;
