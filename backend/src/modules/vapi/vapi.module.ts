import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Call } from '../../database/entities/call.entity';
import { PatientsModule } from '../patients/patients.module';
import { VapiController } from './vapi.controller';
import { VapiService } from './vapi.service';

@Module({
  imports: [TypeOrmModule.forFeature([Call]), PatientsModule],
  controllers: [VapiController],
  providers: [VapiService],
})
export class VapiModule {}
