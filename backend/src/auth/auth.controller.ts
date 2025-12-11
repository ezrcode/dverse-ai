import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Request,
    HttpException,
    HttpStatus,
    Patch,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, UserResponseDto, UpdateSettingsDto, UpdateProfileDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private jwtService: JwtService,
    ) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        try {
            const user = await this.authService.register(registerDto);

            const payload = { email: user.email, sub: user.id };
            const accessToken = this.jwtService.sign(payload);

            return {
                user: {
                    ...user,
                    profilePhotoUrl: user.profilePhotoUrl,
                    language: user.language,
                },
                accessToken,
            };
        } catch (error) {
            throw new HttpException(
                error.message || 'Registration failed',
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        const user = await this.authService.validateUser(
            loginDto.email,
            loginDto.password,
        );

        if (!user) {
            throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
        }

        const payload = { email: user.email, sub: user.id };
        const accessToken = this.jwtService.sign(payload);

        const userResponse: UserResponseDto = {
            id: user.id,
            email: user.email,
            name: user.name,
            profilePhotoUrl: user.profilePhotoUrl,
            language: user.language,
            createdAt: user.createdAt,
        };

        return {
            user: userResponse,
            accessToken,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Request() req) {
        const user = await this.authService.findById(req.user.userId);

        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        const userResponse: UserResponseDto = {
            id: user.id,
            email: user.email,
            name: user.name,
            profilePhotoUrl: user.profilePhotoUrl,
            language: user.language,
            createdAt: user.createdAt,
        };

        return userResponse;
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout() {
        // With JWT, logout is handled client-side by removing the token
        return { message: 'Logged out successfully' };
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
        try {
            return await this.authService.updateProfile(req.user.userId, updateProfileDto);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to update profile',
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('profile/photo')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype.startsWith('image/')) {
                    return cb(new Error('Only image files are allowed'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadProfilePhoto(@UploadedFile() file: any, @Request() req) {
        if (!file) {
            throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
        }
        // Convert to base64 data URL and save to DB
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;
        
        // Update user profile with the base64 image
        await this.authService.updateProfile(req.user.userId, { profilePhotoUrl: dataUrl });
        
        return { url: dataUrl };
    }

    @UseGuards(JwtAuthGuard)
    @Get('settings')
    async getSettings(@Request() req) {
        try {
            return await this.authService.getSettings(req.user.userId);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to get settings',
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('settings')
    async updateSettings(@Request() req, @Body() updateSettingsDto: UpdateSettingsDto) {
        try {
            return await this.authService.updateSettings(req.user.userId, updateSettingsDto);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to update settings',
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}
