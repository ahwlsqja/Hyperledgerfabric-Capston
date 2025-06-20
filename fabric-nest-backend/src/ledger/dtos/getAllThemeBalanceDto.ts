import { IsNotEmpty  } from "class-validator";
import { IsString } from "class-validator";


export class GetAllThemeBalanceDto {
    @IsNotEmpty()
    @IsString()
    ledgerEntryId: string


    @IsNotEmpty()
    @IsString()
    approverId: string;
}