import React from 'react';
import PropTypes from 'prop-types';
import { IoMdMailOpen, IoMdMailUnread, IoMdMail } from 'react-icons/io';

import CardInfo from '../../modules/CardInfo/CardInfo';

const TicketsSummarySection = ({ ticketsInfo, isLoading, className }) => {
  return (
    <div
      className={`grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3 ${className}`}
    >
      <CardInfo
        icon={IoMdMailOpen}
        title='تیکت های باز'
        value={ticketsInfo.openTickets}
        isLoading={isLoading}
      />
      <CardInfo
        icon={IoMdMailUnread}
        title='پاسخ داده نشده'
        value={ticketsInfo.unansweredTickets}
        isLoading={isLoading}
      />
      <CardInfo
        icon={IoMdMail}
        title='تیکت های بسته'
        value={ticketsInfo.closedTickets}
        isLoading={isLoading}
      />
    </div>
  );
};

TicketsSummarySection.propTypes = {
  className: PropTypes.string,
  ticketsInfo: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default TicketsSummarySection;
