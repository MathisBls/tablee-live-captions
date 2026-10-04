import { API_PATHS } from '@tablee/shared';
import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get(API_PATHS.health, () => ({ data: { status: 'ok' } }));

await app.listen({ host: '127.0.0.1', port: 3001 });
