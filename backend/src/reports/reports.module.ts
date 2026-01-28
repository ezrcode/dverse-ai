import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { EnvironmentsModule } from '../environments/environments.module';
import { EncryptionService } from '../common/encryption.service';
import { DataverseService } from '../dataverse/dataverse.service';

@Module({
    imports: [EnvironmentsModule],
    controllers: [ReportsController],
    providers: [ReportsService, EncryptionService, DataverseService],
    exports: [ReportsService],
})
export class ReportsModule {}
