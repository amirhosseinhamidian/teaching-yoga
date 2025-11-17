import { NextResponse } from 'next/server'
import prismadb from '@/libs/prismadb'

export async function GET(request, { params }) {
  const { id } = params

  if (!id) {
    return NextResponse.json(
      { message: 'Question ID is required' },
      { status: 400 }
    )
  }

  try {
    const question = await prismadb.question.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
            phone: true,
            avatar: true,
          },
        },
        course: { select: { title: true } },
        session: {
          include: {
            sessionTerms: {
              select: {
                term: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!question) {
      return NextResponse.json(
        { message: 'Question not found' },
        { status: 404 }
      )
    }

    // آماده‌سازی ترم‌ها
    const terms = question.session.sessionTerms.map((st) => ({
      termId: st.term.id,
      termName: st.term.name,
    }))

    const formatted = {
      id: question.id,
      questionText: question.questionText,
      answerText: question.answerText,
      isAnswered: question.isAnswered,
      isReadByUser: question.isReadByUser,
      answeredAt: question.answeredAt,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      user: question.user,
      course: question.course,
      session: {
        id: question.session.id,
        name: question.session.name,
        terms,
      },
    }

    return NextResponse.json(formatted, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'An error occurred while fetching the question' },
      { status: 500 }
    )
  }
}
