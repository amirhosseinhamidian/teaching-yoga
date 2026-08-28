import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

import { getMediaStorage } from '@/server/storage';

import {
  deleteManagedPublishedVideo,
} from '@/server/video/cleanup-previous-published-video';

import {
  deleteManagedSessionAudio,
  getOrphanTermSessionIds,
} from '@/server/media/term-session-cleanup';

export async function DELETE(request, { params }) {
  const { termId } = params;

  if (!termId) {
    return NextResponse.json({ error: 'Term ID is required' }, { status: 400 });
  }

  try {
    const termIdInt = parseInt(termId, 10);

    if (!Number.isInteger(termIdInt) || termIdInt <= 0) {
      return NextResponse.json(
        { error: 'Term ID is invalid' },
        { status: 400 }
      );
    }

    const deletionResult = await prismadb.$transaction(async (tx) => {
      const term = await tx.term.findUnique({
        where: {
          id: termIdInt,
        },

        select: {
          id: true,
        },
      });

      if (!term) {
        const error = new Error('Term not found');
        error.code = 'TERM_NOT_FOUND';
        throw error;
      }

      /*
       * Session می‌تواند بین چند Term مشترک باشد.
       * بنابراین قبل از حذف لینک‌های این Term مشخص می‌کنیم
       * کدام Session بعد از حذف واقعاً orphan می‌شود.
       */
      const sessionLinks = await tx.sessionTerm.findMany({
        where: {
          termId: termIdInt,
        },

        select: {
          sessionId: true,

          session: {
            select: {
              id: true,

              video: {
                select: {
                  id: true,
                  videoKey: true,
                },
              },

              audio: {
                select: {
                  id: true,
                  audioKey: true,
                },
              },
            },
          },
        },
      });

      const sessionIds = sessionLinks.map(
        (link) => link.sessionId
      );

      const otherSessionLinks =
        sessionIds.length > 0
          ? await tx.sessionTerm.findMany({
              where: {
                sessionId: {
                  in: sessionIds,
                },

                NOT: {
                  termId: termIdInt,
                },
              },

              select: {
                sessionId: true,
              },
            })
          : [];

      const orphanSessionIds =
        getOrphanTermSessionIds({
          sessionIds,

          sharedSessionIds:
            otherSessionLinks.map(
              (link) => link.sessionId
            ),
        });

      const orphanSet =
        new Set(orphanSessionIds);

      const orphanSessions =
        sessionLinks
          .filter((link) =>
            orphanSet.has(
              link.sessionId
            )
          )
          .map((link) => ({
            sessionId:
              link.sessionId,

            videoId:
              link.session?.video?.id ||
              null,

            videoKey:
              link.session?.video?.videoKey ||
              null,

            audioId:
              link.session?.audio?.id ||
              null,

            audioKey:
              link.session?.audio?.audioKey ||
              null,
          }));

      /*
       * Progress جلسات مشترک نباید حذف شود.
       * فقط Sessionهایی که همراه Term حذف می‌شوند پاک می‌شوند.
       */
      if (orphanSessionIds.length > 0) {
        await tx.sessionProgress.deleteMany({
          where: {
            sessionId: {
              in: orphanSessionIds,
            },
          },
        });
      }

      await tx.sessionTerm.deleteMany({
        where: {
          termId: termIdInt,
        },
      });

      await tx.courseTerm.deleteMany({
        where: {
          termId: termIdInt,
        },
      });

      if (orphanSessionIds.length > 0) {
        await tx.session.deleteMany({
          where: {
            id: {
              in: orphanSessionIds,
            },
          },
        });

        const videoIds =
          orphanSessions
            .map(
              (session) =>
                session.videoId
            )
            .filter(Boolean);

        const audioIds =
          orphanSessions
            .map(
              (session) =>
                session.audioId
            )
            .filter(Boolean);

        if (videoIds.length > 0) {
          await tx.sessionVideo.deleteMany({
            where: {
              id: {
                in: videoIds,
              },
            },
          });
        }

        if (audioIds.length > 0) {
          await tx.sessionAudio.deleteMany({
            where: {
              id: {
                in: audioIds,
              },
            },
          });
        }
      }

      await tx.term.delete({
        where: {
          id: termIdInt,
        },
      });

      return {
        orphanSessions,

        sharedSessionCount:
          sessionIds.length -
          orphanSessionIds.length,
      };
    });

    const cleanupWarnings = [];
    let deletedVideoOutputs = 0;
    let deletedAudioFiles = 0;

    if (deletionResult.orphanSessions.length > 0) {
      const storage = getMediaStorage();

      for (const session of deletionResult.orphanSessions) {
        if (session.videoKey) {
          try {
            const result =
              await deleteManagedPublishedVideo({
                storage,
                outputKey:
                  session.videoKey,
              });

            if (result.deleted) {
              deletedVideoOutputs += 1;
            }
          } catch (cleanupError) {
            console.error(
              '[term-delete] Session video cleanup failed:',
              cleanupError
            );

            cleanupWarnings.push(
              `پاک‌سازی فایل ویدئوی جلسه ${session.sessionId} کامل نشد.`
            );
          }
        }

        if (session.audioKey) {
          try {
            const result =
              await deleteManagedSessionAudio({
                storage,
                audioKey:
                  session.audioKey,
              });

            if (result.deleted) {
              deletedAudioFiles += 1;
            }
          } catch (cleanupError) {
            console.error(
              '[term-delete] Session audio cleanup failed:',
              cleanupError
            );

            cleanupWarnings.push(
              `پاک‌سازی فایل صوتی جلسه ${session.sessionId} کامل نشد.`
            );
          }
        }
      }
    }

    return NextResponse.json(
      {
        message:
          cleanupWarnings.length > 0
            ? 'ترم حذف شد، اما بخشی از پاک‌سازی فایل‌های رسانه‌ای کامل نشد.'
            : 'ترم و Sessionهای بدون استفاده آن با موفقیت حذف شدند.',

        cleanup: {
          orphanSessionsDeleted:
            deletionResult.orphanSessions.length,

          sharedSessionsPreserved:
            deletionResult.sharedSessionCount,

          videoOutputsDeleted:
            deletedVideoOutputs,

          audioFilesDeleted:
            deletedAudioFiles,
        },

        warnings:
          cleanupWarnings,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error?.code === 'TERM_NOT_FOUND') {
      return NextResponse.json(
        { error: 'ترم یافت نشد.' },
        { status: 404 }
      );
    }

    console.error('Error deleting term:', error);
    return NextResponse.json({ error: 'خطا در حذف ترم' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { termId } = params;

  if (!termId) {
    return NextResponse.json({ error: 'Term ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, subtitle, price, discount, duration } = body;

    if (!name || !duration) {
      return NextResponse.json(
        { error: 'All fields (name, duration) are required' },
        { status: 400 }
      );
    }

    const updatedTerm = await prismadb.term.update({
      where: { id: parseInt(termId) },
      data: {
        name,
        subtitle,
        price,
        discount,
        duration: parseInt(duration),
      },
    });

    return NextResponse.json(
      { message: 'ترم با موفقیت بروزرسانی شد', term: updatedTerm },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating term:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی ترم' },
      { status: 500 }
    );
  }
}
