import { anthropic, SONNET } from "./client.js";

export interface ConstitutionalArticle {
  number: string;
  title: string;
  relevance: string;
  verdict: "COMPATIBLE" | "QUESTIONABLE" | "CONTRADICTORY";
}

export interface ConstitutionalReviewResult {
  isCompliant: boolean;
  articles: ConstitutionalArticle[];
  findings: string;
}

// Reference set of key articles of the Honduran Constitution (1982, con reformas).
// Not the full 379-article text, but a broad cross-section of the rights,
// powers, separations and guarantees most relevant to ordinary legislation —
// enough for a *preliminary* automated review, never a definitive ruling.
const CONSTITUTION_REFERENCE = `
Constitución de la República de Honduras (1982, con reformas):

— Principios y soberanía —
Art. 1 - Honduras es un Estado de Derecho, soberano, república libre, democrática e independiente, para asegurar justicia, libertad, cultura y bienestar.
Art. 2 - La soberanía corresponde al pueblo; la suplantación de la soberanía popular y la usurpación de poderes se tipifican como delitos de traición a la patria.
Art. 3 - Nadie debe obediencia a un gobierno que usurpe el poder o funciones contra la Constitución.
Art. 4 - La forma de gobierno es republicana, democrática y representativa; se ejerce por tres poderes (Legislativo, Ejecutivo, Judicial) complementarios e independientes y sin relaciones de subordinación. La alternabilidad en la Presidencia es obligatoria.
Art. 5 - El gobierno se sustenta en la democracia participativa (plebiscito y referéndum).

— Derechos individuales —
Art. 59 - La persona humana es el fin supremo de la sociedad y del Estado; dignidad inviolable.
Art. 60 - Todos los hombres nacen libres e iguales; no hay clases privilegiadas; se prohíbe toda discriminación.
Art. 61 - Se garantiza a hondureños y extranjeros la inviolabilidad de la vida, la seguridad individual, la libertad, la igualdad y la propiedad.
Art. 65 - El derecho a la vida es inviolable.
Art. 68 - Derecho al respeto de la integridad física, psíquica y moral.
Art. 69 - La libertad personal es inviolable.
Art. 72 - Es libre la emisión del pensamiento por cualquier medio; no sujeta a censura previa.
Art. 76 - Se garantiza el derecho al honor, a la intimidad personal, familiar y a la propia imagen.
Art. 78 - Se garantizan las libertades de asociación y de reunión sin más límites que la ley.
Art. 80 - Derecho de petición ante las autoridades y a obtener pronta respuesta.
Art. 82 - El derecho de defensa es inviolable.
Art. 84 - Nadie podrá ser arrestado sino en virtud de mandato de autoridad competente conforme a la ley.
Art. 90 - Nadie puede ser juzgado sino por juez competente y con las formalidades del proceso (debido proceso).
Art. 92-94 - Garantías penales: no penas perpetuas/infamantes; irretroactividad de la ley penal salvo más favorable.
Art. 99 - El domicilio es inviolable.
Art. 100 - Inviolabilidad de las comunicaciones y los documentos privados.

— Propiedad y economía —
Art. 103 - Se reconoce, fomenta y garantiza la propiedad privada en su función social.
Art. 106 - Nadie puede ser privado de su propiedad sino por expropiación con indemnización justa previo a la ocupación.
Art. 107 - Restricción de adquisición de inmuebles por extranjeros en zonas fronterizas y litorales.
Art. 111 - El Estado reconoce la función social de la propiedad.

— Trabajo y derechos sociales —
Art. 116 - El trabajo es un derecho y una obligación social.
Art. 127 - Derecho al salario mínimo.
Art. 128 - Garantías laborales mínimas e irrenunciables; derecho de sindicación.
Art. 145 - Derecho a la protección de la salud.
Art. 151 - La educación es función esencial del Estado para la conservación, fomento y difusión de la cultura.

— Poder Legislativo —
Art. 189 - El Congreso Nacional se compone de diputados electos por sufragio directo.
Art. 205 - Atribuciones del Congreso Nacional: crear, decretar, interpretar, reformar y derogar leyes; elegir a ciertos altos funcionarios (Procurador, Fiscal, magistrados según el caso); aprobar o improbar el Presupuesto; entre otras.
Art. 211 - Formación de la ley; iniciativa de ley.

— Poder Ejecutivo —
Art. 235 - El Poder Ejecutivo lo ejerce el Presidente de la República en representación y beneficio del pueblo.
Art. 245 - Atribuciones del Presidente: cumplir y hacer cumplir la Constitución y las leyes; dirigir la política general del Estado; administrar la hacienda pública; entre otras.

— Poder Judicial —
Art. 303 - La potestad de impartir justicia emana del pueblo y se imparte gratuitamente en nombre del Estado por jueces independientes, sólo sometidos a la Constitución y las leyes.
Art. 304 - Corresponde a los órganos jurisdiccionales juzgar y ejecutar lo juzgado.
Art. 314-320 - Organización del Poder Judicial; independencia presupuestaria y funcional.

— Control constitucional, hacienda y responsabilidad —
Art. 175 - Toda ley que contraríe la Constitución es nula; prevalece la Constitución.
Art. 184-185 - Las leyes pueden declararse inconstitucionales por la Corte Suprema de Justicia (control de constitucionalidad).
Art. 222 - El Tribunal Superior de Cuentas es el ente rector del control de los recursos públicos.
Art. 321 - Los servidores del Estado sólo pueden hacer lo que la ley les permite (principio de legalidad).
Art. 322 - Todo funcionario, al tomar posesión, protesta cumplir y hacer cumplir la Constitución y las leyes.
Art. 323 - Los funcionarios son responsables y no exentos de responsabilidad por sus actos.
Art. 324 - Si el servidor público se excede en sus facultades, sus actos son nulos y la responsabilidad es personal.
Art. 351 - El sistema tributario se rige por los principios de legalidad, proporcionalidad, generalidad y equidad, según la capacidad económica.
Art. 373-375 - Reforma de la Constitución; artículos pétreos (forma de gobierno, alternabilidad, período presidencial) que no pueden reformarse.
`;

export async function reviewConstitutionality(
  fullText: string,
  lawTitle: string
): Promise<ConstitutionalReviewResult> {
  const message = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Eres un asistente de análisis jurídico. Realizas una REVISIÓN CONSTITUCIONAL PRELIMINAR y AUTOMATIZADA de una ley hondureña. Esto NO es un dictamen legal ni una sentencia: solo la Corte Suprema de Justicia de Honduras puede declarar inconstitucional una ley (Art. 184-185). Tu trabajo es señalar, con prudencia, qué artículos constitucionales son relevantes y si existen TENSIONES o DUDAS que un ciudadano o un abogado debería revisar.

TÍTULO DE LA LEY: ${lawTitle}

TEXTO DE LA LEY:
${fullText}

REFERENCIA CONSTITUCIONAL (selección de artículos; no es el texto completo de los 379 artículos):
${CONSTITUTION_REFERENCE}

Sé riguroso pero MESURADO: no afirmes una inconstitucionalidad como un hecho; descríbela como una posible tensión a revisar. Si no hay tensiones aparentes, dilo con claridad.

Responde ÚNICAMENTE con JSON válido:
{
  "isCompliant": true|false,   // false SOLO si identificas al menos una tensión seria y concreta con un artículo específico
  "articles": [
    {
      "number": "Art. XX",
      "title": "Nombre del derecho o principio",
      "relevance": "Por qué este artículo es relevante para esta ley",
      "verdict": "COMPATIBLE" | "QUESTIONABLE" | "CONTRADICTORY"
    }
  ],
  "findings": "Análisis prudente. Si hay tensiones, explícalas como puntos a revisar citando el artículo y por qué, sin afirmarlas como conclusión definitiva. Si no las hay, explica por qué la ley parece encuadrar en el marco constitucional. Reconoce los límites de un análisis automatizado basado en una selección de artículos. (mínimo 300 palabras)"
}

Identifica al menos 3 artículos constitucionales relevantes. Recuerda: señalas dudas para el debate público, no emites veredictos.`,
      },
    ],
  });

  const text = message.content[0];
  if (!text || text.type !== "text") throw new Error("No text response in reviewConstitutionality");

  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in constitution response");

  return JSON.parse(jsonMatch[0]) as ConstitutionalReviewResult;
}
