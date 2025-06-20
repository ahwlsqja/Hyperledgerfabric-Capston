import { IsNotEmpty, IsString } from "class-validator";

export class GetVoteStatusDto {
    @IsNotEmpty()
    @IsString()
    ledgerEntryId: string
}