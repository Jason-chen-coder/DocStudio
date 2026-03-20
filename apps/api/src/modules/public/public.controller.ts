import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('spaces')
  async getSpaces(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.publicService.findAllSpaces(pageNum, limitNum, search, sort, order);
  }

  @Get('spaces/:id')
  async getSpace(@Param('id') id: string) {
    return this.publicService.findSpace(id);
  }

  @Get('spaces/:id/docs/tree')
  async getSpaceTree(@Param('id') id: string) {
    return this.publicService.getSpaceDocumentTree(id);
  }

  @Get('docs/:id')
  async getDocument(@Param('id') id: string) {
    return this.publicService.getDocument(id);
  }
}
