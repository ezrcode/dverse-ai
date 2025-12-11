import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { JwtStrategy } from './jwt.strategy';
import { EncryptionService } from '../common/encryption.service';
import { MulterModule } from '@nestjs/platform-express';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        PassportModule,
        MulterModule.register({}),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '7d' },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, EncryptionService],
    exports: [AuthService],
})
export class AuthModule { }
