import sanitizeHtml from "sanitize-html";

export function sanitizeText(text) {
  if (text === null || typeof text !== "string" || !text) return "";
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: [],
  }).trim();
}
