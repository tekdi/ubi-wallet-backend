import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { HousekeepingService } from './housekeeping/housekeeping.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly housekeepingService: HousekeepingService,
  ) {}

  @Get()
  checkHealth(): string {
    return this.appService.checkHealth();
  }

  @Get('housekeeping/stats')
  async getHousekeepingStats() {
    return await this.housekeepingService.getWalletVCWatcherStats();
  }

  @Post('housekeeping/add-watchers')
  async addWatchersForMissingVCs(@Body() body?: { chunkSize?: number }) {
    const chunkSize = body?.chunkSize || 100;
    return await this.housekeepingService.addWatchersForMissingWalletVCs(
      chunkSize,
    );
  }
}
