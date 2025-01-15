import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import Link from 'next/link';

const LicenseCard = ({ licenseLogo, title, path }) => {
  return (
    <Link href={path || '#'} passHref>
      <div
        className={`flex items-center justify-center rounded-lg bg-background-light p-4 transition-all duration-200 ease-in hover:scale-110 dark:bg-background-dark ${path ? 'cursor-pointer' : ''}`}
      >
        <Image
          src={licenseLogo}
          alt={title || 'license logo'}
          width={70}
          height={70}
        />
      </div>
    </Link>
  );
};

// Define the PropTypes
LicenseCard.propTypes = {
  licenseLogo: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  path: PropTypes.string, // optional
};

LicenseCard.defaultProps = {
  path: null,
};

export default LicenseCard;
