import { IsNotEmpty, IsString } from "class-validator";
import { OrganizationType } from "src/types";

export class RegisterUserDto {
    @IsNotEmpty()
    @IsString()
    userId: string;
  
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    orgType: OrganizationType;
  }