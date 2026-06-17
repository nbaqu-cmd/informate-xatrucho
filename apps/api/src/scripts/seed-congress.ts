import "../env.js";
import { db } from "@informate/database";

// Source: official 2026-2030 seat totals confirmed via news search (El Heraldo /
// Proceso Digital coverage of the Nov 30, 2025 general election results).
// Individual deputies below are the 123 (of 128) named in Proceso Digital's
// "Así queda la composición del Congreso Nacional 2026-2030" (Dec 31, 2025),
// https://proceso.hn/asi-queda-la-composicion-del-congreso-nacional-2026-2030/
// — the remaining 5 seats were still contested/unconfirmed at publication and
// are intentionally left out rather than guessed.
const PARTIES = [
  { name: "PARTIDO NACIONAL DE HONDURAS", abbreviation: "PN", color: "#1565C0" },
  { name: "PARTIDO LIBERAL DE HONDURAS", abbreviation: "PL", color: "#C62828" },
  { name: "PARTIDO LIBERTAD Y REFUNDACIÓN", abbreviation: "LIBRE", color: "#AD1457" },
  { name: "PARTIDO INNOVACIÓN Y UNIDAD - SOCIAL DEMÓCRATA", abbreviation: "PINU-SD", color: "#F57C00" },
  { name: "PARTIDO DEMÓCRATA CRISTIANO", abbreviation: "DC", color: "#2E7D32" },
];

const DEPUTIES: Array<{ name: string; party: string; department: string }> = [
  { name: "Alfonso Ordóñez Rodríguez", party: "PARTIDO LIBERAL DE HONDURAS", department: "Atlántida" },
  { name: "Marco Midence", party: "PARTIDO NACIONAL DE HONDURAS", department: "Atlántida" },
  { name: "Enrique Alejandro Matute", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Atlántida" },
  { name: "Alejandro Antonio Canelas", party: "PARTIDO LIBERAL DE HONDURAS", department: "Atlántida" },
  { name: "David Manaiza", party: "PARTIDO NACIONAL DE HONDURAS", department: "Atlántida" },
  { name: "Óscar Ariel Montoya", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Atlántida" },
  { name: "José Domingo Henríquez", party: "PARTIDO LIBERAL DE HONDURAS", department: "Atlántida" },
  { name: "Remberto Alexander Zavala", party: "PARTIDO NACIONAL DE HONDURAS", department: "Atlántida" },
  { name: "Diler Mauricio Martínez", party: "PARTIDO NACIONAL DE HONDURAS", department: "Choluteca" },
  { name: "Carlos Roberto Ledezma", party: "PARTIDO NACIONAL DE HONDURAS", department: "Choluteca" },
  { name: "Yury Cristhian Sabas", party: "PARTIDO LIBERAL DE HONDURAS", department: "Choluteca" },
  { name: "Luis Enrique Ortega", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Choluteca" },
  { name: "Juan Alberto Sauceda", party: "PARTIDO NACIONAL DE HONDURAS", department: "Colón" },
  { name: "Marco Aurelio Maradiaga", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Colón" },
  { name: "Ricardo Elencoff", party: "PARTIDO LIBERAL DE HONDURAS", department: "Colón" },
  { name: "Ariana Banegas", party: "PARTIDO NACIONAL DE HONDURAS", department: "Colón" },
  { name: "Adrián Josué Martínez", party: "PARTIDO NACIONAL DE HONDURAS", department: "Comayagua" },
  { name: "Alberto Emilio Cruz", party: "PARTIDO LIBERAL DE HONDURAS", department: "Comayagua" },
  { name: "Juan Carlos Vargas Ríos", party: "PARTIDO NACIONAL DE HONDURAS", department: "Comayagua" },
  { name: "Ronald Edgardo Panchamé", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Comayagua" },
  { name: "Rolando Enrique Barahona", party: "PARTIDO LIBERAL DE HONDURAS", department: "Comayagua" },
  { name: "Carlos Alberto Meza", party: "PARTIDO NACIONAL DE HONDURAS", department: "Comayagua" },
  { name: "Javier Adolfo Miralda", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Comayagua" },
  { name: "Roy Dagoberto Cruz", party: "PARTIDO NACIONAL DE HONDURAS", department: "Copán" },
  { name: "Erik José Alvarado", party: "PARTIDO NACIONAL DE HONDURAS", department: "Copán" },
  { name: "Valeska Yamileth Valenzuela", party: "PARTIDO LIBERAL DE HONDURAS", department: "Copán" },
  { name: "Isis Carolina Cuéllar", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Copán" },
  { name: "Juan Carlos Lagos", party: "PARTIDO NACIONAL DE HONDURAS", department: "Copán" },
  { name: "Francis Cabrera", party: "PARTIDO LIBERAL DE HONDURAS", department: "Copán" },
  { name: "Eduardo José Elvir", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Copán" },
  { name: "Carlos Umaña", party: "PARTIDO LIBERAL DE HONDURAS", department: "Cortés" },
  { name: "Marlon Lara", party: "PARTIDO LIBERAL DE HONDURAS", department: "Cortés" },
  { name: "Gloria Yazmín Meza", party: "PARTIDO LIBERAL DE HONDURAS", department: "Cortés" },
  { name: "Alejandra Vallecillo", party: "PARTIDO LIBERAL DE HONDURAS", department: "Cortés" },
  { name: "Roberto Pineda Chacón", party: "PARTIDO LIBERAL DE HONDURAS", department: "Cortés" },
  { name: "Sandra Carolina Coleman", party: "PARTIDO LIBERAL DE HONDURAS", department: "Cortés" },
  { name: "José Jaar", party: "PARTIDO NACIONAL DE HONDURAS", department: "Cortés" },
  { name: "Leiby Melissa Torres", party: "PARTIDO LIBERAL DE HONDURAS", department: "Cortés" },
  { name: "Roberto Cosenza", party: "PARTIDO NACIONAL DE HONDURAS", department: "Cortés" },
  { name: "Linda Francés Donaire", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Cortés" },
  { name: "Fernando Enrique Castro", party: "PARTIDO LIBERAL DE HONDURAS", department: "Cortés" },
  { name: "Daysi María Andonie", party: "PARTIDO NACIONAL DE HONDURAS", department: "Cortés" },
  { name: "Scherly Melissa Arriaga", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Cortés" },
  { name: "Thirsa Gabriela López", party: "PARTIDO LIBERAL DE HONDURAS", department: "Cortés" },
  { name: "Alberto Chedrani", party: "PARTIDO NACIONAL DE HONDURAS", department: "Cortés" },
  { name: "Dunia Yadira Jiménez", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Cortés" },
  { name: "Wenceslao Lara Orellana", party: "PARTIDO LIBERAL DE HONDURAS", department: "Cortés" },
  { name: "Cinthya Dayanara Hawit", party: "PARTIDO NACIONAL DE HONDURAS", department: "Cortés" },
  { name: "Rolando Contreras", party: "PARTIDO INNOVACIÓN Y UNIDAD - SOCIAL DEMÓCRATA", department: "Cortés" },
  { name: "Rita María Zúniga", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Cortés" },
  { name: "Gustavo Adolfo González", party: "PARTIDO NACIONAL DE HONDURAS", department: "El Paraíso" },
  { name: "John Milton García", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "El Paraíso" },
  { name: "Pedro Mendoza Flores", party: "PARTIDO LIBERAL DE HONDURAS", department: "El Paraíso" },
  { name: "Walter Antonio Chávez", party: "PARTIDO NACIONAL DE HONDURAS", department: "El Paraíso" },
  { name: "Ever Azael Aguilar", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "El Paraíso" },
  { name: "Mario Edgardo Segura", party: "PARTIDO LIBERAL DE HONDURAS", department: "El Paraíso" },
  { name: "Kilvett Zabdiel Bertrand", party: "PARTIDO NACIONAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "Arnold Daniel Burgos", party: "PARTIDO NACIONAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "Adolfo Raquel Pineda", party: "PARTIDO NACIONAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "Iroshka Lindaly Elvir", party: "PARTIDO LIBERAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "Lissi Marcela Cano", party: "PARTIDO NACIONAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "Saraí Pamela Espinal", party: "PARTIDO LIBERAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "Gustavo Enrique González", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Francisco Morazán" },
  { name: "Johana Bermúdez", party: "PARTIDO NACIONAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "Edgardo Rashid Mejía", party: "PARTIDO LIBERAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "Hugo Noé Pino", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Francisco Morazán" },
  { name: "Sara Eliabeth Estrada Zavala", party: "PARTIDO NACIONAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "José Salomón Názar", party: "PARTIDO LIBERAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "Kritza Jerlin Pérez", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Francisco Morazán" },
  { name: "María José Sosa", party: "PARTIDO NACIONAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "Jhosy Saddam Toscano", party: "PARTIDO LIBERAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "Lucy Michel Guerrero", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Francisco Morazán" },
  { name: "Oswaldo José Ramos", party: "PARTIDO NACIONAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "Alia Niño Kafaty", party: "PARTIDO LIBERAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "Clara Marisabel López", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Francisco Morazán" },
  { name: "Godofredo Fajardo", party: "PARTIDO DEMÓCRATA CRISTIANO", department: "Francisco Morazán" },
  { name: "José Carlenton Dávila", party: "PARTIDO INNOVACIÓN Y UNIDAD - SOCIAL DEMÓCRATA", department: "Francisco Morazán" },
  { name: "Antonio César Rivera", party: "PARTIDO NACIONAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "Luz Ernestina Mejía", party: "PARTIDO LIBERAL DE HONDURAS", department: "Francisco Morazán" },
  { name: "Erika Corina Urtecho", party: "PARTIDO LIBERAL DE HONDURAS", department: "Gracias a Dios" },
  { name: "Víctor Napoleón Amador", party: "PARTIDO NACIONAL DE HONDURAS", department: "Intibucá" },
  { name: "Mario Amílcar Portillo", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Intibucá" },
  { name: "Rumy Nahyp Bueso", party: "PARTIDO LIBERAL DE HONDURAS", department: "Intibucá" },
  { name: "Stephen Garrett García", party: "PARTIDO NACIONAL DE HONDURAS", department: "Islas de la Bahía" },
  { name: "Juan José Zerón", party: "PARTIDO NACIONAL DE HONDURAS", department: "La Paz" },
  { name: "Allan Joel Padilla", party: "PARTIDO LIBERAL DE HONDURAS", department: "La Paz" },
  { name: "Bayron Eduardo Banegas", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "La Paz" },
  { name: "Lenín David Valeriano", party: "PARTIDO NACIONAL DE HONDURAS", department: "Lempira" },
  { name: "Selvin Octavio Morales", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Lempira" },
  { name: "Wilson Rolando Pineda", party: "PARTIDO NACIONAL DE HONDURAS", department: "Lempira" },
  { name: "Dany Leonel Murillo", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Lempira" },
  { name: "Marco Tulio Rodríguez", party: "PARTIDO LIBERAL DE HONDURAS", department: "Lempira" },
  { name: "Tania Gabriela Pinto", party: "PARTIDO NACIONAL DE HONDURAS", department: "Ocotepeque" },
  { name: "Fani Noemí Santos", party: "PARTIDO LIBERAL DE HONDURAS", department: "Ocotepeque" },
  { name: "Karla Patricia Figueroa", party: "PARTIDO NACIONAL DE HONDURAS", department: "Olancho" },
  { name: "Rafael Leonardo Sarmiento", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Olancho" },
  { name: "Óscar Eduardo Rivera", party: "PARTIDO NACIONAL DE HONDURAS", department: "Olancho" },
  { name: "Ángel David Sandoval", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Olancho" },
  { name: "Samuel García", party: "PARTIDO LIBERAL DE HONDURAS", department: "Olancho" },
  { name: "Carlos Eduardo Cano", party: "PARTIDO NACIONAL DE HONDURAS", department: "Olancho" },
  { name: "Marco Ramiro Lobo", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Olancho" },
  { name: "Edgardo Antonio Casaña", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Santa Bárbara" },
  { name: "Mario Orlando Reyes", party: "PARTIDO NACIONAL DE HONDURAS", department: "Santa Bárbara" },
  { name: "Luz Angélica Smith", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Santa Bárbara" },
  { name: "Marcos Bertilio Paz", party: "PARTIDO NACIONAL DE HONDURAS", department: "Santa Bárbara" },
  { name: "Sergio Castellanos", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Santa Bárbara" },
  { name: "Mario Alonso Pérez", party: "PARTIDO NACIONAL DE HONDURAS", department: "Santa Bárbara" },
  { name: "José Rolando Sabillón", party: "PARTIDO LIBERAL DE HONDURAS", department: "Santa Bárbara" },
  { name: "Germán Oswaldo Altamirano", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Santa Bárbara" },
  { name: "María Fernanda Sandres", party: "PARTIDO NACIONAL DE HONDURAS", department: "Santa Bárbara" },
  { name: "Tomás Zambrano", party: "PARTIDO NACIONAL DE HONDURAS", department: "Valle" },
  { name: "Alex Fabricio Zorto", party: "PARTIDO LIBERAL DE HONDURAS", department: "Valle" },
  { name: "Josué Fabricio Carbajal", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Valle" },
  { name: "Lesly Carolina Flores", party: "PARTIDO NACIONAL DE HONDURAS", department: "Valle" },
  { name: "Máxima Alejandra Burgos", party: "PARTIDO NACIONAL DE HONDURAS", department: "Yoro" },
  { name: "Marco Aurelio Tinoco", party: "PARTIDO LIBERAL DE HONDURAS", department: "Yoro" },
  { name: "Felipe Tomás Ponce", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Yoro" },
  { name: "Milton de Jesús Puerto", party: "PARTIDO NACIONAL DE HONDURAS", department: "Yoro" },
  { name: "Gerlen Amanda Bonilla", party: "PARTIDO LIBERAL DE HONDURAS", department: "Yoro" },
  { name: "Jeniffer Alexandra Díaz", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Yoro" },
  { name: "Eder Leonel Mejía", party: "PARTIDO NACIONAL DE HONDURAS", department: "Yoro" },
  { name: "Leonel López Orellana", party: "PARTIDO LIBERAL DE HONDURAS", department: "Yoro" },
  { name: "Melbi Concepción Ortiz", party: "PARTIDO LIBERTAD Y REFUNDACIÓN", department: "Yoro" },
];

async function main() {
  const partyIdByName = new Map<string, string>();

  for (const p of PARTIES) {
    const party = await db.party.upsert({
      where: { name: p.name },
      create: p,
      update: { abbreviation: p.abbreviation, color: p.color },
    });
    partyIdByName.set(p.name, party.id);
  }
  console.log(`[seed-congress] Upserted ${PARTIES.length} parties.`);

  let created = 0;
  let skipped = 0;
  for (const d of DEPUTIES) {
    const partyId = partyIdByName.get(d.party);
    if (!partyId) {
      console.error(`[seed-congress] Unknown party "${d.party}" for ${d.name}, skipping.`);
      continue;
    }
    const existing = await db.congressman.findFirst({ where: { name: d.name } });
    if (existing) {
      skipped++;
      continue;
    }
    await db.congressman.create({
      data: { name: d.name, partyId, district: d.department },
    });
    created++;
  }

  console.log(`[seed-congress] Created ${created} congressmen, skipped ${skipped} already present.`);
  console.log(
    `[seed-congress] Note: 5 of 128 seats were still contested/unconfirmed in the source article and are not included.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-congress] Fatal error:", err);
  process.exit(1);
});
