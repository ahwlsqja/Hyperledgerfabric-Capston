import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'],
  });

  // CORS 설정
  app.enableCors({
    origin: 'http://localhost:3001', // 프론트엔드 URL로 변경
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  const config = new DocumentBuilder()
    .setTitle("fabric-nest")
    .setDescription("fabric-nest Project BackEnd API Document")
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 보낸 데이터 이외의 데이터는 무시
      forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성을 포함하여 요청을 보냄
      transformOptions: {
        enableImplicitConversion: true,
      },
      transform: true
    }),
  );
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
