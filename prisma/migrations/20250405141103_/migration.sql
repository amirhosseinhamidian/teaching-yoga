-- AlterTable
ALTER TABLE "PodcastEpisode" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "episodeNumber" INTEGER,
ADD COLUMN     "explicit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "keywords" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "seasonNumber" INTEGER;
