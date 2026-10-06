import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5177',
    'https://rent-nest-ten-eta.vercel.app',
  ],
});

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );



  // Swagger configuration kiya 
  const config = new DocumentBuilder()
    .setTitle('LIVEZY Furniture Rental API')
    .setDescription('LIVEZY Admin Panel API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();



  