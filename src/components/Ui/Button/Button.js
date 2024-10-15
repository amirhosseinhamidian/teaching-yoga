/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";

const Button = ({ children, onClick, type = 'button', className = '', shadow = false }) => {
    return (
      <button
        type={type}
        onClick={onClick}
        className={`bg-primary text-text-light py-2 px-6 rounded-xl lg:cursor-pointer ${shadow ? 'shadow-[1px_5px_14px_rgba(255,175,41,0.4)]':''} font-main font-medium ${className}`}
      >
        {children}
      </button>
    );
  };
  
  export default Button;