import helmet from '@fastify/helmet';
import type { App } from '../../interfaces';

/** API JSON uniquement : la CSP la plus fermée possible, aucune ressource n'est servie au navigateur. */
export const registerHelmet = async (app: App): Promise<void> => {
  await app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    },
  });
};
