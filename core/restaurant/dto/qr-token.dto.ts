export interface QrTokenResponseDto {
  token: string;
}

export interface ValidateQrTokenResponseDto {
  userId: string;
  email: string;
  name: string;
}

export interface AcceptQrInviteDto {
  token: string;
  roleId: number;
}
