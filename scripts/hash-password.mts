import bcrypt from 'bcryptjs';

const pw = process.argv[2];
if (!pw) {
  console.error('Usage: npm run admin:hash -- "your password"');
  process.exit(1);
}
const hash = bcrypt.hashSync(pw, 12);
// Base64 keeps the `$` characters out of env files, where they get expanded as variables.
console.log(`ADMIN_PASSWORD_HASH=${Buffer.from(hash).toString('base64')}`);
