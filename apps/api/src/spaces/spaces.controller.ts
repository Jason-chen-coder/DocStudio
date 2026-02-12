import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import {
  InviteMemberDto,
  JoinSpaceDto,
  UpdateMemberRoleDto,
} from './dto/member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface RequestWithUser {
  user: {
    id: string;
  };
}

@ApiTags('spaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  @ApiOperation({ summary: '创建新空间' })
  create(
    @Request() req: RequestWithUser,
    @Body() createSpaceDto: CreateSpaceDto,
  ) {
    return this.spacesService.create(req.user.id, createSpaceDto);
  }

  @Get()
  @ApiOperation({ summary: '获取我的空间列表' })
  findAll(@Request() req: RequestWithUser) {
    return this.spacesService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取空间详情' })
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.spacesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新空间信息' })
  update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateSpaceDto: UpdateSpaceDto,
  ) {
    return this.spacesService.update(id, req.user.id, updateSpaceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除空间' })
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    console.log(
      `[SpacesController] Deleting space ${id} for user ${req.user.id}`,
    );
    try {
      const result = await this.spacesService.remove(id, req.user.id);
      console.log(`[SpacesController] Successfully deleted space ${id}`);
      return result;
    } catch (error) {
      console.error(`[SpacesController] Failed to delete space ${id}:`, error);
      throw error;
    }
  }

  // ==================== Member Management ====================

  @Get(':id/members')
  @ApiOperation({ summary: '获取空间成员列表' })
  getMembers(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.spacesService.getMembers(id, req.user.id);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: '更新成员角色' })
  updateMemberRole(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.spacesService.updateMemberRole(
      id,
      userId,
      updateMemberRoleDto.role,
      req.user.id,
    );
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: '移除成员' })
  removeMember(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.spacesService.removeMember(id, userId, req.user.id);
  }

  @Post(':id/invitations')
  @ApiOperation({ summary: '邀请成员' })
  createInvitation(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    return this.spacesService.createInvitation(
      id,
      inviteMemberDto.role,
      req.user.id,
      inviteMemberDto.email,
    );
  }

  @Post('join')
  @ApiOperation({ summary: '通过 Token 加入空间' })
  joinSpace(
    @Request() req: RequestWithUser,
    @Body() joinSpaceDto: JoinSpaceDto,
  ) {
    return this.spacesService.joinSpace(joinSpaceDto.token, req.user.id);
  }
}
