import { IsNotEmpty, IsString } from "class-validator";

export class GetThemeBalanceDto {
    @IsNotEmpty()
    @IsString()
    theme: string;
}