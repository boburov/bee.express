import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  root() {
    return 'salom';
  }

  @Public()
  @Get('health')
  health() {
    return { ok: true, service: this.appService.getHello() };
  }
}
