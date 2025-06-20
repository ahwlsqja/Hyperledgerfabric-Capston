import { IsNotEmpty, IsString } from "class-validator";

export class MembershipApprovalDto {
    @IsNotEmpty()
    @IsString()
    requestId: string;
  
    @IsNotEmpty()
    @IsString()
    approverId: string;

    @IsNotEmpty()
    @IsString()
    userName: string;
  }