// URL base del sitio para construir links absolutos (emails, redirectTo de
// Supabase Auth, etc.). En Vercel usar NEXT_PUBLIC_SITE_URL apuntando al
// dominio de producción; en preview/local cae a VERCEL_URL o localhost.
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
