import { getCourseByShortAddress } from '@/app/actions/courseActions';
import CourseDetailsCard from '@/components/CourseCards/CourseDetailsCard';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import React from 'react';
import { BsCameraVideo } from 'react-icons/bs';
import { WiTime4 } from 'react-icons/wi';
import { BiBarChartAlt2 } from 'react-icons/bi';
import { BiSupport } from 'react-icons/bi';
import { GrGroup } from "react-icons/gr";
import { FaStar } from "react-icons/fa6";
import { BsInfoCircle } from "react-icons/bs";
import { FiMonitor } from "react-icons/fi";

import {
  BEGINNER,
  INTERMEDIATE,
  ADVANCED,
  BEGINNER_INTERMEDIATE,
  INTERMEDIATE_ADVANCED,
} from '@/constants/courseLevels';
import { COMPLETED, IN_PROGRESS } from '@/constants/courseStatus';
import Price from '@/components/Price/Price';
import Button from '@/components/Ui/Button/Button';
import CourseDescriptionCard from '@/components/CourseCards/CourseDescriptionCard';
import CourseLessonsCard from '@/components/CourseCards/CourseLessonsCard';
import CommentsMainCard from '@/components/Comment/CommentsMainCard';

async function page({ params }) {
  const { shortAddress } = params;
  const course = await getCourseByShortAddress(shortAddress);

  if (!course) {
    //TODO: redirect to 404
  }

  const getLevel = (level) => {
    let value = '';
    switch (level) {
      case BEGINNER:
        value = 'مبتدی';
        break;
      case INTERMEDIATE:
        value = 'متوسط';
        break;
      case ADVANCED:
        value = 'پیشرفته';
        break;
      case BEGINNER_INTERMEDIATE:
        value = 'مبتدی/متوسط';
        break;
      case INTERMEDIATE_ADVANCED:
        value = 'متوسط/پیشرفته';
        break;
      default:
        value = 'مبتدی';
        break;
    }
    return value;
  };

  const getCourseStatus = status => {
    let value = '';
    switch (status) {
      case COMPLETED:
        value = 'تکمیل شده';
        break;
      case IN_PROGRESS:
        value = 'در حال تکمیل';
        break;
      default:
        value = 'تکمیل شده';
        break;
    }
    return value;
  };

  return (
    <div className='container'>
      <PageTitle>{course.title}</PageTitle>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 my-4'>
        <div className='col-span-1 rounded-xl bg-surface-light dark:bg-surface-dark shadow p-4'>
            <h4 className='text-subtext-light dark:text-subtext-dark font-semibold mr-4 xs:text-sm'>هزینه و ثبت نام</h4>
            <div className='flex flex-wrap justify-between gap-6 lg:gap-1 mt-2 md:mt-6 mb-2 items-end w-full flex-col-reverse lg:flex-row'>
            <Button shadow className='w-3/4 lg:w-2/4 self-center'>ثبت نام</Button>
            <Price className='ml-4' basePrice={Number(course.basePrice)} price={Number(course.price)}/>
            </div>
        </div>
        <div className='col-span-1 rounded-xl bg-surface-light dark:bg-surface-dark shadow p-4 flex flex-col'>
        <h4 className='text-subtext-light dark:text-subtext-dark font-semibold mr-4 xs:text-sm'>مدرس دوره</h4>
            <div className='flex gap-2 items-center mt-2 md:mt-6 mb-2 '>
                <img src={course.instructor.user.avatar} alt="instructor avatar" className='rounded-full w-16 h-16'/>
                <h5>{course.instructor.user.firstname} {course.instructor.user.lastname} | {course.instructor.describe}</h5>
            </div>
            {/* TODO: outline button */}
            {/* <Button shadow className='w-3/4 lg:w-2/4 self-center mt-3'>ثبت نام</Button> */}
        </div>
      </div>
      <div className='grid grid-cols-2 gap-2 xs:grid-cols-3 sm:grid-cols-4 sm:gap-4 xl:mx-16 2xl:grid-cols-8'>
        <CourseDetailsCard
          icon={BsCameraVideo}
          title='تعداد جلسات'
          value={course.sessionCount}
        />
        <CourseDetailsCard
          icon={WiTime4}
          title='زمان دوره'
          value={course.duration}
        />
        <CourseDetailsCard
          icon={BiBarChartAlt2}
          title='سطح دوره'
          value={getLevel(course.level)}
        />
        <CourseDetailsCard icon={BiSupport} title='پشتیبانی' value='آنلاین' />
        <CourseDetailsCard
          icon={GrGroup}
          title='شرکت کنندگان'
          value={course.participants}
        />
        <CourseDetailsCard
          icon={FaStar}
          title='میزان رضایت'
          value={course.rating}
        />
        <CourseDetailsCard
          icon={FiMonitor}
          title='نوع مشاهده'
          value="آنلاین"
        />
        <CourseDetailsCard
          icon={BsInfoCircle}
          title='وضعیت دوره'
          value={getCourseStatus(course.status)}
        />
      </div>
      <CourseDescriptionCard description={course.description} className='mt-4'/>
      <CourseLessonsCard className='mt-4' terms={course.terms}/>
      <CommentsMainCard className='mt-4'/>
    </div>
  );
}

export default page;
