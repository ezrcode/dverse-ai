import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EnvironmentsModule } from './environments/environments.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ChatModule } from './chat/chat.module';
import { ReportsModule } from './reports/reports.module';
import { QueryDesignerModule } from './query-designer/query-designer.module';
import { User } from './auth/user.entity';
import { Environment } from './environments/environment.entity';
import { Conversation } from './conversations/conversation.entity';
import { Message } from './conversations/message.entity';
import { SavedQuery } from './query-designer/saved-query.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User, Environment, Conversation, Message, SavedQuery],
        synchronize: true, // Set to false in production, use migrations instead
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    EnvironmentsModule,
    ConversationsModule,
    ChatModule,
    ReportsModule,
    QueryDesignerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
