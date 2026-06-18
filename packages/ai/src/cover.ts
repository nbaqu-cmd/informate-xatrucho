import { anthropic, HAIKU } from "./client.js";

/** Fixed topical categories used to color/label the generated law cover. */
export type LawCategory =
  | "SEGURIDAD"
  | "FINANZAS"
  | "ELECCIONES"
  | "SALUD"
  | "INFRAESTRUCTURA"
  | "EDUCACION"
  | "JUSTICIA"
  | "GOBERNANZA"
  | "DERECHOS"
  | "OTRO";

export const CATEGORY_LABELS: Record<LawCategory, string> = {
  SEGURIDAD: "Seguridad",
  FINANZAS: "Finanzas públicas",
  ELECCIONES: "Elecciones",
  SALUD: "Salud",
  INFRAESTRUCTURA: "Infraestructura",
  EDUCACION: "Educación",
  JUSTICIA: "Justicia",
  GOBERNANZA: "Gobernanza",
  DERECHOS: "Derechos",
  OTRO: "Decreto legislativo",
};

export interface CoverMeta {
  /** Short, plain-language topic line for the cover (e.g. "Ascensos en la Policía Nacional"). */
  topicLabel: string;
  category: LawCategory;
}

/**
 * Derives a short human-readable topic line and a topical category for a law,
 * used to build its generated cover graphic. The label is taken from the law's
 * real content — it identifies the decree, it does not editorialize.
 */
export async function generateCoverMeta(title: string, summary: string): Promise<CoverMeta> {
  const message = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 200,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `Resume el tema de esta ley hondureña para la portada de una nota.

TÍTULO: ${title}
RESUMEN: ${summary.slice(0, 1200)}

Devuelve JSON válido EXACTO:
{
  "topicLabel": "una frase CORTA y clara en español (4 a 9 palabras) que diga de qué trata la ley, sin opinar (ej. 'Ascensos de oficiales de la Policía Nacional', 'Cuenta Única para los fondos del Estado', 'Exoneración de deuda a la Cruz Roja de La Lima')",
  "category": "una de: SEGURIDAD, FINANZAS, ELECCIONES, SALUD, INFRAESTRUCTURA, EDUCACION, JUSTICIA, GOBERNANZA, DERECHOS, OTRO"
}

Reglas: el topicLabel debe describir el contenido real, neutral, sin adjetivos de opinión. Escoge la categoría más cercana. Responde SOLO con el JSON.`,
      },
    ],
  });

  const text = message.content[0];
  if (!text || text.type !== "text") throw new Error("No text in cover meta response");
  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in cover meta response");
  const parsed = JSON.parse(jsonMatch[0]) as CoverMeta;
  if (!(parsed.category in CATEGORY_LABELS)) parsed.category = "OTRO";
  return parsed;
}
