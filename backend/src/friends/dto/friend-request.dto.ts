import { IsUUID, IsBoolean } from 'class-validator';

export class SendRequestDto {
  @IsUUID()
  receiverId: string;
}

export class RespondRequestDto {
  @IsBoolean()
  accept: boolean;
}
