import {
  Controller,
  Post,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { HousekeepingService } from './housekeeping.service';
import { LoggerService } from '../common/logger/logger.service';

@Controller('housekeeping')
export class HousekeepingController {
  constructor(
    private readonly housekeepingService: HousekeepingService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Validate the secret key for housekeeping operations
   */
  private validateSecretKey(authorization: string): boolean {
    if (!authorization) {
      return false;
    }

    // Extract the secret key from Authorization header
    // Expected format: "Bearer <secret-key>"
    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return false;
    }

    const secretKey = parts[1];
    const expectedSecretKey = process.env.HOUSEKEEPING_SECRET_KEY;

    if (!expectedSecretKey) {
      this.logger.logError(
        'HOUSEKEEPING_SECRET_KEY environment variable not set',
        new Error('Missing secret key configuration'),
        'HousekeepingController.validateSecretKey',
      );
      return false;
    }

    return secretKey === expectedSecretKey;
  }

  /**
   * Add watchers for missing wallet VCs
   * POST /housekeeping/add-watchers?chunkSize=100
   * Headers: Authorization: Bearer <secret-key>
   */
  @Post('add-watchers')
  @HttpCode(HttpStatus.OK)
  async addWatchersForMissingWalletVCs(
    @Headers('authorization') authorization: string,
    @Query('chunkSize') chunkSize?: string,
  ) {
    // Validate secret key
    if (!this.validateSecretKey(authorization)) {
      this.logger.logError(
        'Invalid or missing secret key for housekeeping operation',
        new Error('Unauthorized access attempt'),
        'HousekeepingController.addWatchersForMissingWalletVCs',
      );
      throw new UnauthorizedException('Invalid or missing secret key');
    }

    const chunkSizeNumber = chunkSize
      ? Math.max(1, parseInt(chunkSize, 10) || 100)
      : 100;

    this.logger.log(
      `HTTP request to add watchers with chunk size: ${Math.max(1, Math.min(1000, chunkSizeNumber))}`,
      'HousekeepingController.addWatchersForMissingWalletVCs',
    );

    const result =
      await this.housekeepingService.addWatchersForMissingWalletVCs(
        chunkSizeNumber,
      );

    return {
      success: result.success,
      message: result.message,
      stats: result.stats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get wallet VC watcher statistics
   * GET /housekeeping/stats
   * Headers: Authorization: Bearer <secret-key>
   */
  @Get('stats')
  async getWalletVCWatcherStats(
    @Headers('authorization') authorization: string,
  ) {
    // Validate secret key
    if (!this.validateSecretKey(authorization)) {
      this.logger.logError(
        'Invalid or missing secret key for housekeeping operation',
        new Error('Unauthorized access attempt'),
        'HousekeepingController.getWalletVCWatcherStats',
      );
      throw new UnauthorizedException('Invalid or missing secret key');
    }

    this.logger.log(
      'HTTP request to get wallet VC watcher statistics',
      'HousekeepingController.getWalletVCWatcherStats',
    );

    const result = await this.housekeepingService.getWalletVCWatcherStats();

    return {
      success: result.success,
      data: result.data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Sync VCs from provider and add watchers for all users
   * POST /housekeeping/sync-vcs-and-add-watchers?provider=dhiway&chunkSize=100
   * Headers: Authorization: Bearer <secret-key>
   */
  @Post('sync-vcs-and-add-watchers')
  @HttpCode(HttpStatus.OK)
  async syncVCsAndAddWatchersForAllUsers(
    @Headers('authorization') authorization: string,
    @Query('provider') provider?: string,
    @Query('chunkSize') chunkSize?: string,
  ) {
    // Validate secret key
    if (!this.validateSecretKey(authorization)) {
      this.logger.logError(
        'Invalid or missing secret key for housekeeping operation',
        new Error('Unauthorized access attempt'),
        'HousekeepingController.syncVCsAndAddWatchersForAllUsers',
      );
      throw new UnauthorizedException('Invalid or missing secret key');
    }

    const providerName = provider || 'dhiway';
    const chunkSizeNumber = chunkSize
      ? Math.max(1, parseInt(chunkSize, 10) || 100)
      : 100;

    this.logger.log(
      `HTTP request to sync VCs and add watchers (provider: ${providerName}, chunk size: ${chunkSizeNumber})`,
      'HousekeepingController.syncVCsAndAddWatchersForAllUsers',
    );

    const result =
      await this.housekeepingService.syncVCsAndAddWatchersForAllUsers(
        providerName,
        chunkSizeNumber,
      );

    return {
      success: result.success,
      message: result.message,
      stats: result.stats,
      timestamp: new Date().toISOString(),
    };
  }
}
