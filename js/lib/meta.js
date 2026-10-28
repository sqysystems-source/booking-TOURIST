/** Updates the document title and social/SEO meta tags (used by the villa page). */
function setMeta(attr, key, value) {
  if (!value) return;
  let node = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attr, key);
    document.head.append(node);
  }
  node.setAttribute('content', value);
}

export function setPageMeta({ title, description, url, image, noindex = false }) {
  if (title) {
    document.title = title;
    setMeta('property', 'og:title', title);
  }
  if (description) {
    setMeta('name', 'description', description);
    setMeta('property', 'og:description', description);
  }
  if (url) {
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.append(link);
    }
    link.href = url;
    setMeta('property', 'og:url', url);
  }
  if (image) setMeta('property', 'og:image', image);
  if (noindex) setMeta('name', 'robots', 'noindex, nofollow');
}
