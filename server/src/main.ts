import './common/bigint.polyfill';
// Load .env into process.env BEFORE AppModule is imported, so values like
// CORS_ORIGINS are available at the time the WebSocket gateway decorator
// (which reads them at import time) is evaluated.
import 'dotenv/config';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { corsOptions } from './common/cors';
import { requestLogger } from './common/request-logger';
import { localUploadsDir } from './uploads/uploads.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Behind nginx/Caddy: trust the first proxy hop so req.ip (used by the
  // rate limiter) reflects the real client, not the proxy.
  const expressApp = app.getHttpAdapter().getInstance() as {
    set: (k: string, v: unknown) => void;
  };
  expressApp.set('trust proxy', 1);

  // Security headers. CSP off — this is a JSON API, not an HTML origin. CORP
  // set to cross-origin so the panels (different origins) can <img>-load the
  // locally-served upload files at /uploads-static.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(requestLogger);

  // Locally-stored uploads (when R2 isn't configured). Served outside the
  // /api prefix; URLs are built in UploadsService via uploadsPublicBaseUrl().
  app.useStaticAssets(localUploadsDir(), { prefix: '/uploads-static/' });

  app.enableCors(corsOptions());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[BeeExpress] API listening on http://localhost:${port}/api`);
}

bootstrap();
