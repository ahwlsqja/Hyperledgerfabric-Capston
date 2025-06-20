import { IsNotEmpty, IsString } from "class-validator";

export class GetOneRegisterStatus {
    @IsNotEmpty()
    @IsString()
    requestId: string;
  }