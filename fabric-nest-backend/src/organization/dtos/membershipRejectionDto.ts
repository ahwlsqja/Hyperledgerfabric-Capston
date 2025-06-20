import { IsNotEmpty, IsString } from "class-validator";

export class MembershipRejectionDto {
    @IsNotEmpty()
    @IsString()
    requestId: string;
  
    @IsNotEmpty()
    @IsString()
    rejectorId: string;

    @IsNotEmpty()
    @IsString()
    userName: string;
  }