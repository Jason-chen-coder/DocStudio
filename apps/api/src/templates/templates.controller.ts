import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplateDto } from './dto/query-template.dto';
import { SaveAsTemplateDto } from './dto/save-as-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: QueryTemplateDto, @Req() req: any) {
    return this.templatesService.findAll(req.user.id, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createTemplateDto: CreateTemplateDto, @Req() req: any) {
    return this.templatesService.create(req.user.id, createTemplateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
    @Req() req: any,
  ) {
    return this.templatesService.update(id, req.user.id, updateTemplateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.templatesService.remove(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('from-document/:documentId')
  createFromDocument(
    @Param('documentId') documentId: string,
    @Body() saveAsTemplateDto: SaveAsTemplateDto,
    @Req() req: any,
  ) {
    return this.templatesService.createFromDocument(
      req.user.id,
      documentId,
      saveAsTemplateDto,
    );
  }
}
