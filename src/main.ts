import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // app.enableCors({
  //   origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [
  //     'http://localhost:1234',
  //   ],
  // });

  await app.listen(process.env.PORT ?? 3012);
}
bootstrap();
