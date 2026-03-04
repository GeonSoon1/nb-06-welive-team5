import { IsString, IsNotEmpty, Matches, IsEnum, IsOptional } from 'class-validator';
import { HouseHolderStatus } from '@prisma/client';

// 1. 입주민 개별 등록
export class CreateResidentDto {
  @IsString()
  @IsNotEmpty({ message: '이름은 필수 입력값입니다.' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: '동 정보는 필수 입력값입니다.' })
  building!: string;

  @IsString()
  @IsNotEmpty({ message: '호수 정보는 필수 입력값입니다.' })
  unitNumber!: string;

  // 예시 사이트 확인하니까 연락처는 숫자만 기입하게 되어있음
  @IsString()
  @Matches(/^\d{10,11}$/, { message: '숫자만 입력해주세요. (예: 01012341234)' })
  contact!: string;

  @IsEnum(HouseHolderStatus, { message: '세대 구분은 세대원 혹은 세대주여야 합니다.' })
  @IsNotEmpty({ message: '세대 구분은 필수 입력값입니다.' })
  isHouseholder!: HouseHolderStatus;
}

// 2. 입주민 정보 수정
export class UpdateResidentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  building?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  unitNumber?: string;

  @IsOptional()
  @Matches(/^\d{10,11}$/, { message: '숫자만 입력해주세요. (예: 01012341234)' })
  contact?: string;

  @IsOptional()
  @IsEnum(HouseHolderStatus, { message: '세대 구분은 세대원 혹은 세대주여야 합니다.' })
  isHouseholder?: HouseHolderStatus;
}
