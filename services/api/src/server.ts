import { serve } from '@hono/node-server';
import { createApp } from './app';
import { readConfig } from './config';

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: createApp(readConfig(process.env)).fetch, port }, () => console.log(`API redakcji działa na porcie ${port}.`));
