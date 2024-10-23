'use server';

import prismadb from '../../../libs/prismadb';

async function getAllCourses() {
    try {
        const courses = await prismadb.course.findMany({
            select: {
                id: true,
                title: true,
                subtitle: true,
                price: true,
                basePrice: true,
                isHighPriority: true,
                cover: true,
                shortAddress: true,
            },
        });

        if (courses.length === 0) {
            throw new Error('No courses found');
        }

        return courses;
    } catch (error) {
        console.error('Error finding courses:', error);
        throw error;
    }
}

async function getCourseByShortAddress(shortAddress) {
    try {
        const course = await prismadb.course.findUnique({
            where: {
                shortAddress: shortAddress,
            },
            include: {
                instructor: {
                  include: {
                    user: true,
                  },
                },
                terms: {
                    include: {
                        sessions: true,
                    }
                }
            }
        });
        if (!course) {
            return null;
        }
        return course;
    } catch (error) {
        console.error('Error fetching course by shortAddress:', error);
        throw new Error('خطایی در دریافت اطلاعات دوره رخ داده است.');
    }
}

export { getAllCourses, getCourseByShortAddress};
