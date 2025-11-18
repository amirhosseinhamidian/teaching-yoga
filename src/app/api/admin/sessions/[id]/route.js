import { NextResponse } from 'next/server'
import prismadb from '@/libs/prismadb'

export async function GET(req, { params }) {
  const { id } = params

  try {
    const session = await prismadb.session.findUnique({
      where: { id },
      include: {
        sessionTerms: {
          include: {
            term: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}
