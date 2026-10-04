/**
 * Sous-ensemble du logger pino dont dépendent les services : ils ne connaissent ni Fastify ni pino.
 * Ne jamais y passer de texte transcrit (la redaction pino n'est qu'un filet de sécurité).
 */
export interface ILogger {
  debug(bindings: object, message: string): void;
  info(bindings: object, message: string): void;
  warn(bindings: object, message: string): void;
  error(bindings: object, message: string): void;
}
