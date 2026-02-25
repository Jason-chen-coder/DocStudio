import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── 用户列表 ────────────────────────────────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: '[超管] 获取全平台用户列表' })
  @ApiResponse({ status: 200, description: '返回分页用户列表' })
  @ApiResponse({ status: 403, description: '非超级管理员' })
  getUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.getUsers(query);
  }

  // ─── 用户详情 ────────────────────────────────────────────────────────────────
  @Get('users/:userId')
  @ApiOperation({ summary: '[超管] 获取用户详情' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  getUserById(@Param('userId') userId: string) {
    return this.adminService.getUserById(userId);
  }

  // ─── 修改密码 ────────────────────────────────────────────────────────────────
  @Patch('users/:userId/password')
  @ApiOperation({ summary: '[超管] 修改指定用户密码' })
  updatePassword(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserPasswordDto,
  ) {
    return this.adminService.updatePassword(userId, dto.newPassword);
  }

  // ─── 禁用 / 启用 ─────────────────────────────────────────────────────────────
  @Patch('users/:userId/status')
  @ApiOperation({ summary: '[超管] 禁用或启用用户账号' })
  @ApiResponse({ status: 403, description: '不能操作超管或自身' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  updateStatus(
    @CurrentUser() currentUser: any,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateStatus(currentUser.id, userId, dto.isDisabled);
  }

  // ─── 删除用户 ────────────────────────────────────────────────────────────────
  @Delete('users/:userId')
  @ApiOperation({ summary: '[超管] 删除用户（级联删除所有数据）' })
  @ApiResponse({ status: 403, description: '不能删除超管或自身' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  deleteUser(
    @CurrentUser() currentUser: any,
    @Param('userId') userId: string,
  ) {
    return this.adminService.deleteUser(currentUser.id, userId);
  }

  // ─── 空间列表（供前端筛选下拉）──────────────────────────────────────────────
  @Get('spaces')
  @ApiOperation({ summary: '[超管] 获取所有空间列表（用于用户筛选下拉框）' })
  getSpaces(@Query('search') search?: string) {
    return this.adminService.getSpaces(search);
  }
}
