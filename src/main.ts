import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { ConfigService } from '@nestjs/config'; // Change: Import from @nestjs/config
import helmet from 'helmet';
import * as compression from 'compression';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Security headers
    app.use(helmet());

    // Compression middleware
    app.use(compression());

    // Rate limiting
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later',
      }),
    );

    // CORS configuration
    app.enableCors({
      origin: configService.get<string[]>('cors.origins', ['*']), // Change: Access using get() with nested path
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Global exception filter
    app.useGlobalFilters(new AllExceptionsFilter());

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // Swagger setup
    const config = new DocumentBuilder()
      .setTitle('Organ Transplant Management API')
      .setDescription('API for managing the organ transplant process')
      .setVersion('1.0')
      .addTag('auth', 'Authentication endpoints')
      .addTag('doctors', 'Doctor management endpoints')
      .addTag('institutions', 'Institution management endpoints')
      .addTag('donors', 'Donor management endpoints')
      .addTag('receivers', 'Receiver management endpoints')
      .addTag('organs', 'Organ management endpoints')
      .addTag('compatibility', 'Compatibility management endpoints')
      .addTag('transportation', 'Transportation management endpoints')
      .addTag('reports', 'Reporting endpoints')
      .addTag('notifications', 'Notification endpoints')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = configService.get<number>('port', 3000); // Change: Access using get() method
    await app.listen(port);

    console.log(`Application is running on: http://localhost:${port}/api/v1`);
    console.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
    console.log(`Environment: ${configService.get<string>('environment', 'development')}`); // Change: Access using get() method
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
