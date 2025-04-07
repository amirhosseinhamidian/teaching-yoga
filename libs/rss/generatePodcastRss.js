/* eslint-disable no-undef */
export function generatePodcastRss(podcast) {
  const siteUrl = 'https://samaneyoga.ir';

  const episodesXml = podcast.episodes
    .filter((ep) => !ep.isDraft)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .map((ep) => {
      const durationMin = Math.floor(ep.duration / 60);
      const durationSec = ep.duration % 60;
      const duration = `${durationMin}:${durationSec.toString().padStart(2, '0')}`;

      return `
          <item>
            <title><![CDATA[${ep.title}]]></title>
            <description><![CDATA[${ep.description}]]></description>
            <pubDate>${new Date(ep.publishedAt).toUTCString()}</pubDate>
            <guid>${siteUrl}/podcast/${podcast.slug}/${ep.slug}</guid>
            <link>${siteUrl}/podcast/${podcast.slug}/${ep.slug}</link>
            <enclosure url="${ep.audioUrl}" type="audio/mpeg" length="0" />
            <itunes:duration>${duration}</itunes:duration>
            ${ep.explicit ? '<itunes:explicit>yes</itunes:explicit>' : ''}
            ${ep.keywords ? `<itunes:keywords>${ep.keywords}</itunes:keywords>` : ''}
            ${ep.coverImageUrl ? `<itunes:image href="${ep.coverImageUrl}" />` : ''}
          </item>
        `;
    })
    .join('\n');

  const rssXml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0"
        xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
        xmlns:atom="http://www.w3.org/2005/Atom">
        <channel>
          <title><![CDATA[${podcast.title}]]></title>
          <link>${siteUrl}/podcast/${podcast.slug}</link>
          <language>${podcast.language || 'fa-ir'}</language>
          <description><![CDATA[${podcast.description}]]></description>
          <itunes:author><![CDATA[${podcast.hostName}]]></itunes:author>
          <itunes:summary><![CDATA[${podcast.description}]]></itunes:summary>
          <itunes:image href="${podcast.logoUrl}" />
          <itunes:explicit>${podcast.explicit ? 'yes' : 'no'}</itunes:explicit>
          <itunes:category text="${podcast.genre || 'Education'}" />
          ${podcast.keywords ? `<itunes:keywords>${podcast.keywords}</itunes:keywords>` : ''}
          ${
            podcast.websiteUrl
              ? `<itunes:owner><itunes:name>${podcast.hostName}</itunes:name><itunes:email>${podcast.email || 'info@yourdomain.com'}</itunes:email></itunes:owner>`
              : ''
          }
          <atom:link href="${siteUrl}/rss" rel="self" type="application/rss+xml"/>
          ${episodesXml}
        </channel>
      </rss>
    `.trim();

  return rssXml;
}
