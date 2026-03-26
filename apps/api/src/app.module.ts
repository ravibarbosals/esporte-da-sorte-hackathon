import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InsightsModule } from './modules/insights/insights.module';
import { PlayersModule } from './modules/players/players.module';
import { TeamsModule } from './modules/teams/teams.module';
import { MatchesModule } from './modules/matches/matches.module';
import { PredictionsModule } from './modules/predictions/predictions.module';
import { OddsModule } from './modules/odds/odds.module';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import * as fs from 'fs';

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbSsl = String(config.get('DB_SSL', 'false')).toLowerCase() === 'true';
        const caPath = config.get<string>('DB_SSL_CA_PATH', './ca.pem');

        const ssl = dbSsl
          ? {
              rejectUnauthorized: false,
              ...(caPath && fs.existsSync(caPath)
                ? { ca: fs.readFileSync(caPath).toString() }
                : {}),
            }
          : false;

        return {
          type: 'postgres',
          host: config.get('DB_HOST', 'localhost'),
          port: config.get<number>('DB_PORT', 5432),
          username: config.get('DB_USER'),
          password: config.get('DB_PASS'),
          database: config.get('DB_NAME'),
          ssl,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
        };
      },
    }),
    InsightsModule,
    PlayersModule,
    TeamsModule,
    MatchesModule,
    PredictionsModule,
    OddsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
