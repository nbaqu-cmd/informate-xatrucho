import { anthropic, HAIKU } from "./client.js";

export interface LawSummaryResult {
  plainSpanish: string;
  keyPoints: string[];
}

export async function summarizeLaw(fullText: string): Promise<LawSummaryResult> {
  const message = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Eres un experto en legislación hondureña. Tu tarea es resumir la siguiente ley en español claro y sencillo para que cualquier ciudadano hondureño la entienda, sin importar su nivel educativo.

LEY:
${fullText}

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "plainSpanish": "Resumen completo en español sencillo (3-5 párrafos)",
  "keyPoints": ["Punto clave 1", "Punto clave 2", "Punto clave 3", "..."]
}

Reglas:
- Sin jerga legal
- Explica qué hace la ley, cuándo aplica, y a quién afecta
- Los puntos clave deben ser concisos (máximo 2 líneas cada uno)
- Mínimo 5 puntos clave, máximo 10`,
      },
    ],
  });

  const text = message.content[0];
  if (!text || text.type !== "text") throw new Error("No text response from AI");

  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in summarize response");

  return JSON.parse(jsonMatch[0]) as LawSummaryResult;
}
