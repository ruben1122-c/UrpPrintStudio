import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { sendError } from './lib/http.js';
import { authRouter } from './routes/auth.js';
import { checkoutRouter } from './routes/checkout.js';
import { contactRouter } from './routes/contact.js';
import { meRouter } from './routes/me.js';
import { ordersRouter } from './routes/orders.js';

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'urp-printstudio-api' });
});

app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/contact', contactRouter);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  sendError(response, error);
});

export default app;
