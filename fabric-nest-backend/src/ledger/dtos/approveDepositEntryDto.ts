import { IsNotEmpty, IsString } from "class-validator";

export class ApproveDepositEntryDto {
    @IsNotEmpty()
    @IsString()
    ledgerEntryId: string


    @IsNotEmpty()
    @IsString()
    approverId: string;
}