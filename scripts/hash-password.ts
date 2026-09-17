/**
 * Genera l'hash bcrypt di una nuova password admin.
 * Uso: npx tsx scripts/hash-password.ts "nuova-password"
 *
 * L'hash contiene simboli "$" che Next.js interpreta come riferimenti a
 * variabili quando legge un file .env* in locale (dotenv-expand). Per
 * questo servono due valori diversi a seconda di dove lo incolli.
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Uso: npx tsx scripts/hash-password.ts "nuova-password"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
const escapedForDotenv = hash.replace(/\$/g, "\\$");

console.log("\nIncolla in .env.local (in locale — i simboli $ vanno protetti):");
console.log(`ADMIN_PASSWORD_HASH=${escapedForDotenv}`);
console.log("\nIncolla su Vercel (Environment Variables — valore raw, senza backslash):");
console.log(hash);
console.log("");
