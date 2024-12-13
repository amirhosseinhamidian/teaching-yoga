import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';

const LicenseCard = ({ licenseLogo, title, path }) => {
  return (
    <div
      className={`flex items-center justify-center rounded-lg bg-background-light p-4 transition-all duration-200 ease-in hover:scale-110 dark:bg-background-dark ${path ? 'cursor-pointer' : ''}`}
      onClick={path}
    >
      <Image src={licenseLogo} alt={title} width={70} height={70} />
    </div>
  );
};

// Define the PropTypes
LicenseCard.propTypes = {
  licenseLogo: PropTypes.string,
  title: PropTypes.string,
  path: PropTypes.string,
};

export default LicenseCard;
