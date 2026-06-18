import { anthropic, HAIKU } from "./client.js";

export interface ImageQueryPlan {
  /** One-line plain description of the law's concrete real-world subject, for the relevance check. */
  subject: string;
  /** Spanish, Honduras-specific search phrases for Wikimedia Commons (real Honduran institutions/people/places). */
  hondurasQueries: string[];
  /** Neutral, country-agnostic noun phrases for a generic close-up that illustrates without claiming a place. */
  genericQueries: string[];
}

/**
 * Plans an image search for a Honduran law. Produces two kinds of queries on
 * the SAME concrete subject: Honduras-specific Spanish phrases (which surface
 * real Honduran photos on Wikimedia Commons — the National Police, the
 * Congress, named officials, Honduran places) and neutral generic phrases for
 * a country-agnostic close-up (a ballot, a document, money) used only as a
 * non-misleading fallback. Also returns a one-line subject description used to
 * vet candidates.
 */
export async function generateImageQueryPlan(title: string, summary: string): Promise<ImageQueryPlan> {
  const message = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 350,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `Eres editor de fotografía de un medio periodístico hondureño serio. Necesitas ilustrar una nota sobre una ley SIN engañar al lector: la imagen debe representar de verdad el tema, y preferiblemente el contexto HONDUREÑO.

TÍTULO: ${title}
RESUMEN: ${summary.slice(0, 1500)}

Devuelve JSON válido EXACTAMENTE con esta forma:
{
  "subject": "una frase que describa el sujeto concreto y real de la ley (qué objeto, institución, lugar o actividad de Honduras representa), en español",
  "hondurasQueries": ["4 búsquedas CORTAS para Wikimedia Commons: 2 en ESPAÑOL y 2 en INGLÉS. Una de las inglesas debe ser la forma MÁS SIMPLE posible: la palabra 'Honduras' + UN sustantivo (ej. 'Honduras police', 'Honduras congress', 'Honduras port', 'Honduras hospital', 'Honduras school'). Muchas fotos hondureñas en Commons tienen título en inglés simple."],
  "genericQueries": ["2 frases CORTAS en INGLÉS para un primer plano neutral y genérico del objeto físico del tema, que ilustre sin afirmar un país (ej. 'ballot box', 'police uniform insignia', 'land title document', 'ambulance')"]
}

Reglas:
- hondurasQueries deben ser CORTAS (2-3 palabras máximo), tipo búsqueda por palabras clave, NO frases descriptivas largas. La búsqueda de Commons falla con muchas palabras.
  Buenos ejemplos: "Policía Nacional Honduras", "Honduras police", "Congreso Nacional Honduras", "Honduras congress", "Puerto Cortés", "Honduras port". Da la institución/lugar concreta + "Honduras".
  Malos ejemplos (demasiado específicos o abstractos, no encuentran nada): "Policía Nacional de Honduras uniforme rango galones", "Police ranks Honduras".
- genericQueries deben ser objetos universales y neutrales, NO escenas identificables de otro país (nada de "American police", nada de banderas o edificios extranjeros).
- Si la ley es abstracta (finanzas, cuentas, seguros) y no tiene objeto visual hondureño claro, usa en hondurasQueries la institución del Estado hondureño responsable de forma corta (ej. "Congreso Nacional Honduras", "Banco Central Honduras").

Responde SOLO con el JSON.`,
      },
    ],
  });

  const text = message.content[0];
  if (!text || text.type !== "text") throw new Error("No text response from AI");
  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in image query plan response");
  const parsed = JSON.parse(jsonMatch[0]) as ImageQueryPlan;
  parsed.hondurasQueries = (parsed.hondurasQueries ?? []).filter(Boolean);
  parsed.genericQueries = (parsed.genericQueries ?? []).filter(Boolean);
  return parsed;
}

export interface ImageCandidate {
  title: string;
  description?: string;
  tags: string[];
  /** Source provenance, e.g. "Wikimedia Commons (Honduras)" or "Openverse". */
  source: string;
}

/**
 * Vets candidate images against the law's real subject under a serious news
 * outlet's standard, and returns the acceptable ones ranked best-first.
 *
 * The hard rule that the old check lacked: an image that is identifiably from a
 * DIFFERENT country (foreign uniforms, foreign flags, named foreign places or
 * institutions, recognizable foreign people) MUST be rejected when the law is
 * about a Honduran institution — showing American police for a Honduran police
 * law misleads the reader, even though both are "police". Acceptable images are
 * either genuinely Honduran, or neutral close-ups of a universal object that
 * make no claim about place. Honduran images rank above neutral ones; anything
 * misleading or off-topic is excluded entirely.
 */
export async function rankRelevantImages(
  subject: string,
  summary: string,
  candidates: ImageCandidate[]
): Promise<number[]> {
  if (candidates.length === 0) return [];

  const list = candidates
    .map((c, i) => {
      const desc = c.description ? ` — ${c.description.slice(0, 140)}` : "";
      const tags = c.tags.length ? ` [${c.tags.slice(0, 6).join(", ")}]` : "";
      return `${i + 1}. (${c.source}) "${c.title}"${desc}${tags}`;
    })
    .join("\n");

  const message = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 1000,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `Eres el editor de fotografía de un medio periodístico hondureño SERIO. Una nota trata sobre esta ley de Honduras.

SUJETO CONCRETO DE LA LEY: ${subject}
RESUMEN: ${summary.slice(0, 1000)}

Candidatos de imagen (solo conoces título/descripción/etiquetas; la búsqueda automática puede equivocarse — no asumas que son válidos):
${list}

REGLAS EDITORIALES ESTRICTAS (somos un medio serio, no podemos engañar):
1. RECHAZA cualquier imagen identificable de OTRO país cuando la ley trata de una institución hondureña: uniformes, patrullas, banderas, edificios, matrículas o personas reconocibles de otro país (ej. "College of DuPage Police", "Washington", policía de EE.UU.). Mostrar policías estadounidenses para una ley sobre la policía hondureña ENGAÑA, aunque ambos sean "policía". Esto es lo más importante.
1b. RECHAZA imágenes cuyo SUJETO principal es personal o militares EXTRANJEROS, aunque la foto se haya tomado EN Honduras (ej. "JTF-Bravo", "US Army", "USNS", "U.S. Marines", soldados estadounidenses en misión en Honduras). El protagonista de la foto debe ser hondureño, no solo el lugar. Una misión militar estadounidense NO sirve para una ley sobre una institución hondureña.
2. ACEPTA imágenes genuinamente hondureñas (Policía Nacional de Honduras, Congreso Nacional de Honduras, ciudades/departamentos de Honduras, funcionarios hondureños).
3. ACEPTA un primer plano NEUTRO y universal que no afirma un país (una urna electoral, dinero, una ambulancia, un barco pesquero) SOLO si muestra DIRECTAMENTE el objeto físico central de la ley. RECHAZA escenas vagas o solo tangencialmente relacionadas (ej. "documentos tachados en una oficina" para una ley sobre permisos de funcionarios NO sirve). Si la ley es abstracta y no tiene un objeto físico central claro, NO aceptes una imagen genérica forzada.
4. RECHAZA logos, memes, mapas, gráficos, escudos, sátira, mascotas, y coincidencias de una sola palabra sin relación real.
5. Ante la duda, RECHAZA. Es mejor no poner imagen que poner una equivocada.

Evalúa cada candidato en MUY POCAS PALABRAS (máximo 6 palabras por candidato: aceptar/rechazar y por qué). NO escribas párrafos. Es OBLIGATORIO terminar SIEMPRE con la línea RESPUESTA, así que sé breve para no quedarte sin espacio.

Al final, devuelve ÚNICAMENTE una línea con los números de los candidatos ACEPTABLES ordenados del mejor al peor, separados por comas, o la palabra NINGUNO si ninguno cumple. ORDEN DE PRIORIDAD:
1ro) Imágenes hondureñas que muestran DIRECTAMENTE el sujeto específico de la ley (ej. policías hondureños para una ley sobre la policía; un puerto hondureño para una ley portuaria).
2do) La institución hondureña general relacionada (ej. el edificio del Congreso Nacional), cuando no haya algo más específico.
3ro) Primeros planos neutros del objeto.
Formato exacto:
RESPUESTA: 3, 1
o
RESPUESTA: NINGUNO`,
      },
    ],
  });

  const text = message.content[0];
  if (!text || text.type !== "text") return [];
  const match = text.text.match(/RESPUESTA:\s*([0-9,\s]+|NINGUNO)/i);
  if (!match || !match[1] || /NINGUNO/i.test(match[1])) return [];
  const indices = match[1]
    .split(",")
    .map((n) => parseInt(n.trim(), 10) - 1)
    .filter((n) => n >= 0 && n < candidates.length);
  // De-dupe while preserving order.
  return [...new Set(indices)];
}
