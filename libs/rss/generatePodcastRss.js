import {
  toAbsoluteAppUrl,
  toAbsoluteMediaUrl,
} from '@/server/media/absolute-url';

const escapeXml = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const toCdata = (value) => {
  return String(value ?? '').replace(/]]>/g, ']]]]><![CDATA[>');
};

const toValidDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const toRssDate = (value) => {
  const date = toValidDate(value);

  return date ? date.toUTCString() : new Date().toUTCString();
};

const formatDuration = (value) => {
  const totalSeconds = Math.max(0, Math.floor(Number(value) || 0));

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [
      hours,
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');
  }

  return [minutes, seconds.toString().padStart(2, '0')].join(':');
};

const getAudioMimeType = (audioUrl) => {
  const cleanUrl = String(audioUrl || '')
    .split(/[?#]/)[0]
    .toLowerCase();

  if (cleanUrl.endsWith('.m4a') || cleanUrl.endsWith('.mp4')) {
    return 'audio/mp4';
  }

  if (cleanUrl.endsWith('.wav')) {
    return 'audio/wav';
  }

  if (cleanUrl.endsWith('.ogg')) {
    return 'audio/ogg';
  }

  if (cleanUrl.endsWith('.webm')) {
    return 'audio/webm';
  }

  if (cleanUrl.endsWith('.aac')) {
    return 'audio/aac';
  }

  return 'audio/mpeg';
};

const normalizeKeywords = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(', ');
  }

  return String(value || '').trim();
};

const getEpisodeGuid = (episode, audioUrl) => {
  if (episode?.id) {
    return `urn:podcast-episode:${episode.id}`;
  }

  return audioUrl;
};

const getLastBuildDate = (episodes) => {
  const dates = episodes
    .map((episode) =>
      toValidDate(episode.publishedAt || episode.updatedAt || episode.createdAt)
    )
    .filter(Boolean);

  if (dates.length === 0) {
    return new Date();
  }

  return new Date(Math.max(...dates.map((date) => date.getTime())));
};

const buildEpisodeItem = (podcast, episode) => {
  const audioUrl = toAbsoluteMediaUrl(episode.audioUrl);

  if (!audioUrl) {
    return '';
  }

  const episodeImageUrl = toAbsoluteMediaUrl(
    episode.coverImageUrl || podcast.logoUrl || podcast.bannerUrl
  );

  const keywords = normalizeKeywords(episode.keywords);

  const fileSize = Math.max(
    0,
    Number(episode.fileSize || episode.audioSize || 0) || 0
  );

  const seasonTag =
    Number.isInteger(Number(episode.seasonNumber)) &&
    Number(episode.seasonNumber) > 0
      ? `<itunes:season>${Number(episode.seasonNumber)}</itunes:season>`
      : '';

  const episodeTag =
    Number.isInteger(Number(episode.episodeNumber)) &&
    Number(episode.episodeNumber) > 0
      ? `<itunes:episode>${Number(episode.episodeNumber)}</itunes:episode>`
      : '';

  const imageTag = episodeImageUrl
    ? `<itunes:image href="${escapeXml(episodeImageUrl)}" />`
    : '';

  const keywordsTag = keywords
    ? `<itunes:keywords>${escapeXml(keywords)}</itunes:keywords>`
    : '';

  return `
    <item>
      <title>${escapeXml(episode.title)}</title>

      <description>${escapeXml(
        episode.metaDescription || episode.description
      )}</description>

      <content:encoded><![CDATA[${toCdata(
        episode.description
      )}]]></content:encoded>

      <guid isPermaLink="false">${escapeXml(
        getEpisodeGuid(episode, audioUrl)
      )}</guid>

      <pubDate>${escapeXml(
        toRssDate(episode.publishedAt || episode.createdAt)
      )}</pubDate>

      <enclosure
        url="${escapeXml(audioUrl)}"
        type="${escapeXml(getAudioMimeType(audioUrl))}"
        length="${fileSize}"
      />

      <itunes:title>${escapeXml(episode.title)}</itunes:title>

      <itunes:summary>${escapeXml(
        episode.metaDescription || episode.description
      )}</itunes:summary>

      <itunes:duration>${escapeXml(
        formatDuration(episode.duration)
      )}</itunes:duration>

      <itunes:explicit>${episode.explicit ? 'yes' : 'no'}</itunes:explicit>

      ${seasonTag}
      ${episodeTag}
      ${imageTag}
      ${keywordsTag}
    </item>
  `;
};

export const generatePodcastRss = (podcast, episodesInput) => {
  if (!podcast) {
    throw new Error('Podcast data is required.');
  }

  const episodes = Array.isArray(episodesInput)
    ? episodesInput
    : Array.isArray(podcast.episodes)
      ? podcast.episodes
      : [];

  const now = new Date();

  const publishedEpisodes = episodes
    .filter((episode) => {
      if (!episode || episode.isDraft) {
        return false;
      }

      const publishedAt = toValidDate(episode.publishedAt);

      return !publishedAt || publishedAt <= now;
    })
    .sort((left, right) => {
      const leftDate = toValidDate(left.publishedAt || left.createdAt);

      const rightDate = toValidDate(right.publishedAt || right.createdAt);

      return (rightDate?.getTime() || 0) - (leftDate?.getTime() || 0);
    });

  const channelLink = toAbsoluteAppUrl(podcast.websiteUrl || '/podcast');

  const feedUrl = toAbsoluteAppUrl(
    podcast.rssFeed || `/podcast/${podcast.slug || 'feed'}/rss.xml`
  );

  const channelImageUrl = toAbsoluteMediaUrl(
    podcast.logoUrl || podcast.bannerUrl
  );

  const keywords = normalizeKeywords(podcast.keywords);

  const items = publishedEpisodes
    .map((episode) => buildEpisodeItem(podcast, episode))
    .filter(Boolean)
    .join('\n');

  const imageBlock = channelImageUrl
    ? `
          <image>
            <url>${escapeXml(channelImageUrl)}</url>

            <title>${escapeXml(podcast.title)}</title>

            <link>${escapeXml(channelLink)}</link>
          </image>

          <itunes:image href="${escapeXml(channelImageUrl)}" />
        `
    : '';

  const ownerBlock = podcast.email
    ? `
          <itunes:owner>
            <itunes:name>${escapeXml(
              podcast.hostName || podcast.title
            )}</itunes:name>

            <itunes:email>${escapeXml(podcast.email)}</itunes:email>
          </itunes:owner>
        `
    : '';

  const categoryBlock = podcast.genre
    ? `
          <itunes:category text="${escapeXml(podcast.genre)}" />
        `
    : '';

  const keywordsBlock = keywords
    ? `
          <itunes:keywords>${escapeXml(keywords)}</itunes:keywords>
        `
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss
  version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
>
  <channel>
    <title>${escapeXml(podcast.title)}</title>

    <link>${escapeXml(channelLink)}</link>

    <description>${escapeXml(podcast.description)}</description>

    <language>${escapeXml(podcast.language || 'fa-IR')}</language>

    <lastBuildDate>${escapeXml(
      getLastBuildDate(publishedEpisodes).toUTCString()
    )}</lastBuildDate>

    <atom:link
      href="${escapeXml(feedUrl)}"
      rel="self"
      type="application/rss+xml"
    />

    <itunes:author>${escapeXml(
      podcast.hostName || podcast.title
    )}</itunes:author>

    <itunes:summary>${escapeXml(
      podcast.metaDescription || podcast.description
    )}</itunes:summary>

    <itunes:explicit>${podcast.explicit ? 'yes' : 'no'}</itunes:explicit>

    <itunes:type>episodic</itunes:type>

    ${imageBlock}
    ${ownerBlock}
    ${categoryBlock}
    ${keywordsBlock}

    ${items}
  </channel>
</rss>`;
};

export default generatePodcastRss;
