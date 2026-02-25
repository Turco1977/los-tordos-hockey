/* Run with: npx tsx scripts/create-users.ts */

const BASE = process.env.BASE_URL || "https://los-tordos-hockey.vercel.app";
const PASSWORD = "lostordoshockey2026";

const USERS = [
  { first_name: "Franco", last_name: "Lucchini", email: "flucchini@lostordoshockey.com.ar", role: "director_deportivo", ramas: ["A","B","C","D","E"], divisiones: [] },
  { first_name: "Florencia", last_name: "Marquez", email: "fmarquez@lostordoshockey.com.ar", role: "directora_hockey", ramas: ["A","B","C","D","E"], divisiones: [] },
  { first_name: "Matías", last_name: "Elías", email: "melias@lostordoshockey.com.ar", role: "coordinador_pf", ramas: ["A","B","C","D","E"], divisiones: [] },
  { first_name: "Emmanuel", last_name: "Morales", email: "emorales@lostordoshockey.com.ar", role: "responsable_gym", ramas: ["A","B","C","D","E"], divisiones: [] },
  { first_name: "Franco", last_name: "Medici", email: "fmedici@lostordoshockey.com.ar", role: "entrenador", ramas: ["A"], divisiones: ["Primera","Segunda"] },
  { first_name: "Juan Ignacio", last_name: "González", email: "jgonzalez@lostordoshockey.com.ar", role: "entrenador", ramas: ["A"], divisiones: ["Primera","Segunda"] },
  { first_name: "Laureano", last_name: "Muslera", email: "lmuslera@lostordoshockey.com.ar", role: "entrenador", ramas: ["A"], divisiones: ["Primera","Segunda"] },
  { first_name: "Josefina", last_name: "Ojeda", email: "jojeda@lostordoshockey.com.ar", role: "entrenador", ramas: ["B"], divisiones: ["Primera","Segunda"] },
  { first_name: "Clara", last_name: "Urrutia", email: "currutia@lostordoshockey.com.ar", role: "entrenador", ramas: ["B"], divisiones: ["Primera","Segunda"] },
  { first_name: "Milagros", last_name: "Pérez Pontis", email: "mperezpontis@lostordoshockey.com.ar", role: "entrenador", ramas: ["B"], divisiones: ["Primera","Segunda"] },
  { first_name: "Lucila", last_name: "Santucci", email: "lsantucci@lostordoshockey.com.ar", role: "entrenador", ramas: ["C"], divisiones: ["Quinta","Sexta"] },
  { first_name: "Juan", last_name: "Carballo", email: "jcarballo@lostordoshockey.com.ar", role: "entrenador", ramas: ["C"], divisiones: ["Quinta","Sexta"] },
  { first_name: "Juan", last_name: "López", email: "jlopez@lostordoshockey.com.ar", role: "entrenador", ramas: ["C"], divisiones: ["Quinta","Sexta"] },
  { first_name: "Gonzalo", last_name: "Franco", email: "gfranco@lostordoshockey.com.ar", role: "entrenador", ramas: ["C"], divisiones: ["Quinta","Sexta"] },
  { first_name: "Carla", last_name: "González", email: "cgonzalez@lostordoshockey.com.ar", role: "entrenador", ramas: ["D"], divisiones: ["Séptima","Octava"] },
  { first_name: "Sol", last_name: "Cruceño", email: "scruceno@lostordoshockey.com.ar", role: "entrenador", ramas: ["D"], divisiones: ["Séptima","Octava"] },
  { first_name: "Agustín", last_name: "Rubiño", email: "arubino@lostordoshockey.com.ar", role: "entrenador", ramas: ["D"], divisiones: ["Séptima","Octava"] },
  { first_name: "Valentina", last_name: "Neira", email: "vneira@lostordoshockey.com.ar", role: "entrenador", ramas: ["D"], divisiones: ["Séptima","Octava"] },
  { first_name: "Facundo", last_name: "Paredes", email: "fparedes@lostordoshockey.com.ar", role: "entrenador", ramas: ["E"], divisiones: ["Novena","Décima","Pre Décima"] },
  { first_name: "Agostina", last_name: "Fredes", email: "afredes@lostordoshockey.com.ar", role: "entrenador", ramas: ["E"], divisiones: ["Novena","Décima","Pre Décima"] },
  { first_name: "Teresita", last_name: "Trabazo", email: "ttrabazo@lostordoshockey.com.ar", role: "entrenador", ramas: ["E"], divisiones: ["Novena","Décima","Pre Décima"] },
  { first_name: "Tamara", last_name: "Tejada", email: "ttejada@lostordoshockey.com.ar", role: "entrenador", ramas: ["E"], divisiones: ["Novena","Décima","Pre Décima"] },
  { first_name: "Juan A.", last_name: "Famiglietti", email: "jfamiglietti@lostordoshockey.com.ar", role: "pf", ramas: ["A"], divisiones: ["Primera","Segunda"] },
  { first_name: "Manuela", last_name: "Quevedo", email: "mquevedo@lostordoshockey.com.ar", role: "entrenador", ramas: ["E"], divisiones: ["Novena","Décima","Pre Décima"] },
  { first_name: "Nahir", last_name: "Uzair", email: "nuzair@lostordoshockey.com.ar", role: "entrenador", ramas: ["E"], divisiones: ["Novena","Décima","Pre Décima"] },
  { first_name: "Camila", last_name: "Lázzaro", email: "clazzaro@lostordoshockey.com.ar", role: "entrenador", ramas: ["E"], divisiones: ["Novena","Décima","Pre Décima"] },
  { first_name: "Milagros", last_name: "Baztan", email: "mbaztan@lostordoshockey.com.ar", role: "entrenador", ramas: ["E"], divisiones: ["Novena","Décima","Pre Décima"] },
  { first_name: "Pedro", last_name: "Alvarado", email: "palvarado@lostordoshockey.com.ar", role: "entrenador", ramas: ["A"], divisiones: ["Mamis"] },
  { first_name: "Enzo", last_name: "Bataglia", email: "ebataglia@lostordoshockey.com.ar", role: "entrenador", ramas: ["A"], divisiones: ["Cuartas"] },
  { first_name: "Gilberto", last_name: "Guerci", email: "gguerci@lostordoshockey.com.ar", role: "desarrollo_motor", ramas: ["D","E"], divisiones: ["Séptima","Octava","Novena","Décima","Pre Décima"] },
  { first_name: "Federico", last_name: "Ontivero", email: "fontivero@lostordoshockey.com.ar", role: "pf", ramas: ["B","C"], divisiones: ["Primera","Segunda","Quinta","Sexta"] },
  { first_name: "Federico", last_name: "García", email: "fgarcia@lostordoshockey.com.ar", role: "pf", ramas: ["C","D"], divisiones: ["Quinta","Sexta","Séptima","Octava"] },
  { first_name: "Segundo", last_name: "Gelardi", email: "sgelardi@lostordoshockey.com.ar", role: "pf", ramas: ["D","E"], divisiones: ["Séptima","Octava","Novena","Décima","Pre Décima"] },
  { first_name: "Carolina", last_name: "Armani", email: "carmani@lostordoshockey.com.ar", role: "pf", ramas: ["E"], divisiones: ["Novena","Décima","Pre Décima"] },
  { first_name: "Florencia", last_name: "Herrera", email: "fherrera@lostordoshockey.com.ar", role: "monitora", ramas: ["D","E"], divisiones: ["Séptima","Octava","Novena","Décima","Pre Décima"] },
  { first_name: "Camila", last_name: "Correa", email: "ccorrea@lostordoshockey.com.ar", role: "monitora", ramas: ["D","E"], divisiones: ["Séptima","Octava","Novena","Décima","Pre Décima"] },
  { first_name: "Amparo", last_name: "Blanco", email: "ablanco@lostordoshockey.com.ar", role: "monitora", ramas: ["D","E"], divisiones: ["Séptima","Octava","Novena","Décima","Pre Décima"] },
];

async function main() {
  let ok = 0, fail = 0;
  for (const u of USERS) {
    try {
      const res = await fetch(`${BASE}/api/admin/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...u, password: PASSWORD }),
      });
      const data = await res.json();
      if (data.error) {
        console.error(`FAIL ${u.email}: ${data.error}`);
        fail++;
      } else {
        console.log(`OK ${u.email}`);
        ok++;
      }
    } catch (e: any) {
      console.error(`ERROR ${u.email}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\nDone: ${ok} created, ${fail} failed`);
}

main();
