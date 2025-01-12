/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import CardInfo from '../../modules/CardInfo/CardInfo';
import { BiSolidCommentDetail } from 'react-icons/bi';
import { BiSolidCommentCheck } from 'react-icons/bi';
import { MdCommentBank } from 'react-icons/md';

const CommentSummarySection = ({ className, type }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [commentInfo, setCommentInfo] = useState(null);

  const fetchCommentInfo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/comment/info?type=${type}`,
      );
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setCommentInfo(data);
      } else {
        toast.showErrorToast('خطایی رخ داده است');
      }
    } catch (error) {
      toast.showErrorToast('خطای غیرمنتظره در باکس اطلاعات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommentInfo();
  }, [type]);

  return (
    <div
      className={`grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3 ${className}`}
    >
      <CardInfo
        icon={BiSolidCommentDetail}
        title='کل نظرات'
        value={commentInfo?.totalComments}
        isLoading={isLoading}
      />
      <CardInfo
        icon={BiSolidCommentCheck}
        title='نظرات تایید شده'
        value={commentInfo?.approvedComments}
        isLoading={isLoading}
      />
      <CardInfo
        icon={MdCommentBank}
        title='نظرات در ۳۰ روز گذشته'
        value={commentInfo?.recentComments}
        isLoading={isLoading}
      />
    </div>
  );
};

CommentSummarySection.propTypes = {
  className: PropTypes.string,
  type: PropTypes.oneOf(['course', 'article']).isRequired,
};

export default CommentSummarySection;
