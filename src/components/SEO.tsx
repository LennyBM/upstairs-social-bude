import { Helmet } from 'react-helmet-async';
import { site } from '../config/site';

interface Props {
  title: string;
  description: string;
  path?: string;
  image?: string;
}

export function SEO({ title, description, path = '', image }: Props) {
  const url = site.siteUrl + path;
  const img = site.siteUrl + '/images/' + (image || site.hero);
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="keywords" content={site.seoKeywords.join(', ')} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
}
