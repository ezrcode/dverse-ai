import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryDesignerController } from './query-designer.controller';
import { QueryDesignerService } from './query-designer.service';
import { SavedQuery } from './saved-query.entity';
import { EnvironmentsModule } from '../environments/environments.module';
import { EncryptionService } from '../common/encryption.service';
import { DataverseService } from '../dataverse/dataverse.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([SavedQuery]),
        EnvironmentsModule,
    ],
    controllers: [QueryDesignerController],
    providers: [QueryDesignerService, EncryptionService, DataverseService],
    exports: [QueryDesignerService],
})
export class QueryDesignerModule {}
