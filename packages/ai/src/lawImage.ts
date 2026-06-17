import { anthropic, HAIKU } from "./client.js";

/**
 * Generates several English stock-photo search queries for the same real, concrete
 * topic of the law, ordered from most specific to broadest. Stock-photo libraries
 * are inconsistently stocked, so trying a few phrasings of the SAME true subject
 * (not different subjects) materially improves match rate without loosening relevance.
 */
export async function generateImageSearchQueries(title: string, summary: string): Promise<string[]> {
  const message = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: `Eres un asistente que ayuda a encontrar fotografías de stock relevantes para artículos periodísticos sobre leyes hondureñas.

TÍTULO DE LA LEY: ${title}
RESUMEN: ${summary.slice(0, 1500)}

Da CUATRO términos de búsqueda en INGLÉS para un banco de imágenes de stock, todos describiendo el MISMO tema concreto y literal de esta ley (no temas distintos ni asociaciones simbólicas):
1. Específico (3-4 palabras), ej. "fishing boat license inspection"
2. Medio (2-3 palabras), ej. "fishing boat"
3. El sustantivo común MÁS SIMPLE posible que un hablante de inglés usaría para nombrar el objeto/institución/vehículo concreto (1-2 palabras EXACTAS, sin ninguna palabra descriptiva adicional como "office", "process", "ceremony", "building", "coverage", "service"), ej. "ambulance" o "land registry" o "passport" o "fishing boat"
4. Un sinónimo de ese mismo sustantivo simple, igualmente corto y sin palabras descriptivas adicionales, ej. "paramedic vehicle" o "property deed" o "travel document" o "fishing vessel"

Reglas importantes:
- Las cuatro deben describir el sujeto EXACTO mencionado en el resumen, solo variando la redacción — no cambies de tema entre ellas.
- Evita términos abstractos, legales o genéricos como "law" o "government".
- Si el resumen trata sobre un nombramiento, comisión o cargo institucional sin un objeto físico/visual claro, describe la INSTITUCIÓN o ACTIVIDAD concreta involucrada, no un concepto adyacente.

Responde ÚNICAMENTE con las cuatro líneas, una por término, sin numeración, sin comillas, sin explicación.`,
      },
    ],
  });

  const text = message.content[0];
  if (!text || text.type !== "text") throw new Error("No text response from AI");
  const queries = text.text
    .split("\n")
    .map((line) => line.trim().replace(/^[\d.\-)\s]+/, "").replace(/^["']|["']$/g, ""))
    .filter(Boolean);
  if (queries.length === 0) throw new Error("No search queries generated");
  return queries;
}

export interface ImageCandidate {
  title: string;
  tags: string[];
}

export async function pickRelevantImage(
  title: string,
  summary: string,
  candidates: ImageCandidate[]
): Promise<number | null> {
  if (candidates.length === 0) return null;

  const list = candidates
    .map(
      (c, i) =>
        `${i + 1}. "${c.title}"${c.tags.length ? ` (etiquetas: ${c.tags.slice(0, 6).join(", ")})` : ""}`
    )
    .join("\n");

  const message = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 250,
    messages: [
      {
        role: "user",
        content: `Una ley hondureña trata específicamente sobre: "${title}"
Resumen completo: ${summary.slice(0, 1200)}

Estos son candidatos de fotos de stock (solo se conoce su título y etiquetas — fueron encontrados por una búsqueda automática que puede estar equivocada, no asumas que son relevantes solo por aparecer aquí):
${list}

Tu tarea: elegir la foto que mejor representa el mismo objeto, lugar, institución o actividad CONCRETA mencionada en la ley (aunque sea de otro país, época, o un ejemplo genérico del mismo tipo de cosa — eso está BIEN, lo que importa es que sea el mismo tipo de objeto/actividad real, no un símbolo ni una asociación indirecta).

Acepta, por ejemplo: una foto de un edificio de registro de la propiedad para una ley sobre catastro/registro de tierras; una foto de una ambulancia real para una ley sobre servicios de emergencia; una foto de un pasaporte real para una ley sobre documentos de viaje o asuntos consulares.
Rechaza: memes, sátira, mascotas, fotos personales sin relación real con el tema, o coincidencias de una sola palabra sin relación temática real (ej. una foto de "Land Rover" para una ley de registro de tierras, o un meme de "pasaporte de vacuna" para una ley sobre pasaportes diplomáticos).

Primero, en una sola línea breve, identifica el tema CONCRETO real de la ley. Luego evalúa cada candidato contra ese tema. Termina tu respuesta ÚNICAMENTE con una línea en este formato exacto, sin nada más después:
RESPUESTA: <número del candidato 1-${candidates.length}, o 0 si ninguno aplica>`,
      },
    ],
  });

  const text = message.content[0];
  if (!text || text.type !== "text") return null;
  const match = text.text.match(/RESPUESTA:\s*(\d+)/i);
  const num = parseInt(match?.[1] ?? "0", 10);
  if (!num || num < 1 || num > candidates.length) return null;
  return num - 1;
}
