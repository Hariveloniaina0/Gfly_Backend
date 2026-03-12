import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Candidature } from './entities/candidature.entity';
import { CandidaturesService } from './candidatures.service';
import { CandidaturesController } from './candidatures.controller';
import { MailModule } from '../../common/mail/mail.module';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidature]),
    ConfigModule,
    MailModule,
     AuthModule,
  ],
  controllers: [CandidaturesController],
  providers: [CandidaturesService],
  exports: [CandidaturesService],
})
export class CandidaturesModule {}