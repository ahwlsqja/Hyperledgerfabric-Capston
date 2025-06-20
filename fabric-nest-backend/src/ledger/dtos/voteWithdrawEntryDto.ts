import { IsNotEmpty, IsString } from "class-validator";

export class VoteWithdrawEntryDto {
    @IsNotEmpty()
    @IsString()
    ledgerEntryId: string

    @IsNotEmpty()
    @IsString()
    voterId: string;

    @IsNotEmpty()
    vote: 'approve' | 'reject';
}