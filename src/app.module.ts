import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AuthModule } from './core/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { User } from './modules/users/entities/user.entity';
import { Offre } from './modules/offres/entities/offre.entity';
import databaseConfig from './config/database.config';
import { UsersService } from './modules/users/users.service';
import { OffresModule } from './modules/offres/offres.module';
import { UploadModule } from './common/upload/upload.module';
import { CandidaturesModule } from './modules/candidatures/candidatures.module';
import { Candidature } from './modules/candidatures/entities/candidature.entity';
import { ContactModule } from './modules/contact/contact.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [User, Offre, Candidature],
        synchronize: process.env.NODE_ENV !== 'production',
        //dropSchema: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    OffresModule,
    UploadModule,
    CandidaturesModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly usersService: UsersService) { }

  async onModuleInit() {
    await this.usersService.seedAdmin();
  }
}