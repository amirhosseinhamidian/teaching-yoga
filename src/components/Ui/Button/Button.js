/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";

const Button = ({ children, onClick, type = 'button', disable = false, className = '', shadow = false }) => {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disable}
        className={`xs:text-base text-xs disabled:opacity-70 bg-primary text-text-light py-2 px-2 sm:px-6 rounded-xl lg:cursor-pointer ${shadow ? 'shadow-[1px_5px_14px_rgba(255,175,41,0.4)] active:shadow-none':''} font-main font-medium ${className}`}
      >
        {children}
      </button>
    );
  };
  
  export default Button;