import { IsNotEmpty, IsString } from "class-validator";

export class FinalizeWithdrawVoteDto {
    @IsNotEmpty()
    @IsString()
    finalizerId: string;
}