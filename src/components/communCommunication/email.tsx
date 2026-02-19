import React from "react";

interface EmailButtonProps {
  email: string;
}

const SendEmail: React.FC<EmailButtonProps> = ({ email }) => {
  const handleClick = () => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 border border-gray-300 bg-white px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-gray-50"
    >
      <span className="text-xs">✉️</span> Email
    </button>
  );
};

export default SendEmail;
