import DOMPurify from 'dompurify';

export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h3', 'h4'],
    ALLOWED_ATTR: [],
  });
}
