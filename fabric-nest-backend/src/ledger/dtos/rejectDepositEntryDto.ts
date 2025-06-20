import { IsNotEmpty, IsString } from "class-validator";

export class RejectDepositEntryDto {
    @IsNotEmpty()
    @IsString()
    ledgerEntryId: string
    
    @IsNotEmpty()
    @IsString()
    rejectorId: string;
}