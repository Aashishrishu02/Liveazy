import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestTimingInterceptor } from './common/interceptors/request-timing.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5178',
      'https://rent-nest-ten-eta.vercel.app',
      /^https:\/\/rent-nest-[a-z0-9-]+\.vercel\.app$/,
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new RequestTimingInterceptor());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('LIVEZY Furniture Rental API')
    .setDescription('LIVEZY Admin Panel API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`LIVEZY API listening on 0.0.0.0:${port}`);
}

void bootstrap().catch((err: unknown) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});