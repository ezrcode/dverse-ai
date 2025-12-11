import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentsService } from './environments.service';
import { EnvironmentsController } from './environments.controller';
import { Environment } from './environment.entity';
import { EncryptionService } from '../common/encryption.service';
import { DataverseService } from '../dataverse/dataverse.service';

@Module({
    imports: [TypeOrmModule.forFeature([Environment])],
    controllers: [EnvironmentsController],
    providers: [EnvironmentsService, EncryptionService, DataverseService],
    exports: [EnvironmentsService],
})
export class EnvironmentsModule { }
