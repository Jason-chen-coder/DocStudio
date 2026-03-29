import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
// Fastify types imported as values (not 'import type') for decorator metadata
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册', description: '创建新用户账号' })
  @ApiResponse({
    status: 201,
    description: '注册成功',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '邮箱已被注册' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录', description: '使用邮箱和密码登录' })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: '邮箱或密码错误' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取当前用户信息', description: '需要 JWT 认证' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: '未授权' })
  getMe(@CurrentUser() user: UserResponseDto) {
    return user;
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '修改密码', description: '需要 JWT 认证' })
  @ApiResponse({ status: 200, description: '密码修改成功' })
  @ApiResponse({ status: 401, description: '当前密码错误或未授权' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async changePassword(
    @CurrentUser() user: UserResponseDto,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  // ==================== 邮箱验证 ====================

  @Get('verify-email')
  @ApiOperation({ summary: '验证邮箱', description: '通过邮件链接验证邮箱地址' })
  @ApiResponse({ status: 200, description: '验证成功' })
  @ApiResponse({ status: 400, description: '无效的验证令牌' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重新发送验证邮件' })
  @ApiResponse({ status: 200, description: '验证邮件已发送' })
  async resendVerification(@CurrentUser() user: UserResponseDto) {
    return this.authService.resendVerification(user.id);
  }

  // ==================== 密码重置 ====================

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '忘记密码', description: '发送密码重置邮件' })
  @ApiResponse({ status: 200, description: '如果邮箱存在将发送重置邮件' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重置密码', description: '使用重置令牌设置新密码' })
  @ApiResponse({ status: 200, description: '密码重置成功' })
  @ApiResponse({ status: 400, description: '无效或已过期的重置令牌' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // ==================== 账号删除 ====================

  @Post('delete-account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除账号', description: '永久删除当前用户账号及所有数据' })
  @ApiResponse({ status: 200, description: '账号已删除' })
  @ApiResponse({ status: 401, description: '密码错误' })
  async deleteAccount(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.authService.deleteAccount(user.id, dto.password);
  }

  // ==================== Refresh Token ====================

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新令牌', description: '使用 refresh_token 获取新的 access_token' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  @ApiResponse({ status: 401, description: '无效的刷新令牌' })
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  // ==================== OAuth 登录 ====================

  @Get('google')
  @ApiExcludeEndpoint()
  async googleLogin(@Res() res: any) {
    // Fastify 不兼容 passport 的 res.setHeader 重定向，手动构造 Google OAuth URL
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri:
        process.env.GOOGLE_CALLBACK_URL ||
        `${process.env.API_URL || 'http://localhost:3001'}/auth/google/callback`,
      response_type: 'code',
      scope: 'email profile',
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return res.code(302).header('Location', url).send();
  }

  @Get('google/callback')
  @ApiExcludeEndpoint()
  async googleCallback(@Query('code') code: string, @Res() res: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const failUrl = `${frontendUrl}/auth/login?error=oauth_failed`;

    if (!code) {
      return res.code(302).header('Location', failUrl).send();
    }

    try {
      // 1. 用 code 换 access_token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri:
            process.env.GOOGLE_CALLBACK_URL ||
            `${process.env.API_URL || 'http://localhost:3001'}/auth/google/callback`,
          grant_type: 'authorization_code',
        }),
      });
      const tokenData: any = await tokenRes.json();

      if (!tokenData.access_token) {
        return res.code(302).header('Location', failUrl).send();
      }

      // 2. 用 access_token 拉取用户信息
      const profileRes = await fetch(
        'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
      );
      const profile: any = await profileRes.json();

      // 3. 创建或更新用户，生成 JWT
      const result = await this.authService.oauthLogin({
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
      });

      const url = `${frontendUrl}/auth/oauth-callback?token=${result.access_token}&refresh_token=${result.refresh_token}`;
      return res.code(302).header('Location', url).send();
    } catch {
      return res.code(302).header('Location', failUrl).send();
    }
  }

  @Get('github')
  @ApiExcludeEndpoint()
  async githubLogin(@Res() res: any) {
    // Fastify 不兼容 passport 的 res.setHeader 重定向，手动构造 GitHub OAuth URL
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || '',
      redirect_uri:
        process.env.GITHUB_CALLBACK_URL ||
        `${process.env.API_URL || 'http://localhost:3001'}/auth/github/callback`,
      scope: 'user:email',
    });
    const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
    return res.code(302).header('Location', url).send();
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  @ApiExcludeEndpoint()
  async githubCallback(@Req() req: any, @Res() res: any) {
    const profile = req.user;
    const result = await this.authService.oauthLogin({
      githubId: profile.githubId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const url = `${frontendUrl}/auth/oauth-callback?token=${result.access_token}&refresh_token=${result.refresh_token}`;
    return res.code(302).header('Location', url).send();
  }
}
