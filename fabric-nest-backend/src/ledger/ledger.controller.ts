import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Patch
} from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('ledger')
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post('deposit')
  async addDepositEntry(
    @Body('userId') userId: string,
    @Body('theme') theme: string,
    @Body('amount') amount: string,
    @Body('description') description: string,
    @Body('documentURL') documentURL: string = '',
  ) {
    return this.ledgerService.addDepositEntry(
      userId,
      theme,
      amount,
      description,
      documentURL,
    );
  }

  @Post('withdraw')
  async addWithdrawEntry(
    @Body('userId') userId: string,
    @Body('theme') theme: string,
    @Body('amount') amount: string,
    @Body('description') description: string,
    @Body('documentURL') documentURL: string = '',
  ) {
    return this.ledgerService.addWithdrawEntry(
      userId,
      theme,
      amount,
      description,
      documentURL,
    );
  }

  @Patch('deposit/:ledgerEntryId/approve')
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async approveDepositEntry(
    @Param('ledgerEntryId') ledgerEntryId: string,
    @Body('approverId') approverId: string,
  ) {
    return this.ledgerService.approveDepositEntry(ledgerEntryId, approverId);
  }

  @Put('deposit/:ledgerEntryId/reject')
  async rejectDepositEntry(
    @Param('ledgerEntryId') ledgerEntryId: string,
    @Body('rejectorId') rejectorId: string,
  ) {
    return this.ledgerService.rejectDepositEntry(ledgerEntryId, rejectorId);
  }

  @Patch('withdraw/:ledgerEntryId/vote')
  async voteWithdrawEntry(
    @Param('ledgerEntryId') ledgerEntryId: string,
    @Body('voterId') voterId: string,
    @Body('vote') vote: 'approve' | 'reject',
  ) {
    return this.ledgerService.voteWithdrawEntry(ledgerEntryId, voterId, vote);
  }

  @Put('withdraw/:ledgerEntryId/finalize')
  async finalizeWithdrawVote(
    @Param('ledgerEntryId') ledgerEntryId: string,
    @Body('finalizerId') finalizerId: string,
  ) {
    return this.ledgerService.finalizeWithdrawVote(ledgerEntryId, finalizerId);
  }

  @Get('deposits/pending')
  async getPendingDepositEntries() {
    return this.ledgerService.getPendingDepositEntries();
  }

  @Get('withdraws/pending')
  async getPendingWithdrawEntries() {
    return this.ledgerService.getPendingWithdrawEntries();
  }

  @Get('withdraw/:ledgerEntryId/vote-status')
  async getWithdrawVoteStatus(@Param('ledgerEntryId') ledgerEntryId: string) {
    return this.ledgerService.getWithdrawVoteStatus(ledgerEntryId);
  }

  @Get('theme/:theme/balance')
  async getThemeBalance(@Param('theme') theme: string) {
    return this.ledgerService.getThemeBalance(theme);
  }

  @Get('themes/balances')
  async getAllThemeBalances() {
    return this.ledgerService.getAllThemeBalances();
  }

  @Get('theme/:theme/entries')
  async getLedgerEntriesByTheme(@Param('theme') theme: string) {
    return this.ledgerService.getLedgerEntriesByTheme(theme);
  }

  @Get('entries')
  async getAllLedgerEntries() {
    return this.ledgerService.getAllLedgerEntries();
  }

  @Post('check-expired-withdraws')
  async checkExpiredWithdrawEntries() {
    return this.ledgerService.checkExpiredWithdrawEntries();
  }
}