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

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        database: config.get('DB_NAME'),
        ssl: {
          rejectUnauthorized: true, //colocar false
          ca: require('fs').readFileSync('./ca.pem').toString(),
        },
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, //colocar false
      }),
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
