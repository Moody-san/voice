import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Vapi's end-of-call-report includes the full transcript + message history,
  // which easily exceeds Express's default 100kb body limit. Raise it.
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Allow the Next.js dashboard (any origin in this take-home) to call the API.
  app.enableCors();

  // Server-side validation is authoritative. Validation failures return 422
  // (Unprocessable Entity); the exception filter shapes them into the
  // { data: null, error: { message, details } } envelope.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      errorHttpStatusCode: 422,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Voice Patient Registration API')
    .setDescription('REST API for patient demographic records.')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port} (docs at /docs)`);
}
void bootstrap();
