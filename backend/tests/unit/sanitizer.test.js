import { sanitizeText } from "../../src/utils/sanitize";

describe("Sanitizer Utils", () => {
  describe("sanitizeText", () => {
    test("deve remover todas as tags HTML", () => {
      const input = "<script>alert(xss)</script>Texto Limpo";
      const output = sanitizeText(input);
      expect(output).toBe("Texto Limpo");
    });
    test("deve retornar string vazia para null", () => {
      expect(sanitizeText(null)).toBe("");
      expect(sanitizeText(undefined)).toBe("");
    });
    test("deve fazer trim do texto", () => {
      const input = "     texto com espaço    ";
      const output = sanitizeText(input);
      expect(output).toBe("texto com espaço");
    });
  });
});
