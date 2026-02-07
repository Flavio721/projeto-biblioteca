import sanitizeHtml from "sanitize-html";

export function sanitizeText(text) {
  if (text == null || typeof text !== "string") return "";
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: []
  }).trim();
}