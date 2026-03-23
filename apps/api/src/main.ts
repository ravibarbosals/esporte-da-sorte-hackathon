import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MatchesScheduler } from './modules/matches/matches.scheduler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Esporte da Sorte API')
    .setDescription('API de análise esportiva')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3001);

  const scheduler = app.get(MatchesScheduler);
  await scheduler.syncMatches();
  setInterval(() => scheduler.syncOdds(), 60000);
}
bootstrap();
