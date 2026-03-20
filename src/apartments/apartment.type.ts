
import { Prisma, Apartment, ApartmentStructureGroup, User } from '@prisma/client';

/**
 * 1. [관리자용] 상세 정보 타입 정의
 */
export type ApartmentWithRelations = Prisma.ApartmentGetPayload<{
  include: {
    structureGroups: {
      select: {
        id: true;
        dongList: true;
        startFloor: true;
        maxFloor: true;
        unitsPerFloor: true;
      };
    };
    admin: {
      select: {
        id: true;
        name: true;
        email: true;
        contact: true;
      };
    };
  };
}>;

export type FlatApartmentResponse = Omit<ApartmentWithRelations, 'admin'> & {
  adminId: string | null;
  adminName: string | null;
  adminContact: string | null;
  adminEmail: string | null;
};

/**
 * 2. [공개용] 상세 정보 타입 정의
 */
export type PublicApartmentDetail = Prisma.ApartmentGetPayload<{
  select: {
    id: true;
    name: true;
    address: true;
    structureGroups: {
      select: {
        dongList: true;
        startFloor: true;
        maxFloor: true;
        unitsPerFloor: true;
      };
    };
  };
}>;


// 1. 조회할 데이터의 '형태'를 타입
export type AdminApartmentWithRelations = Apartment & {
  admin: Pick<User, 'name' | 'contact' | 'email'> | null;
  structureGroups: Pick<ApartmentStructureGroup, 'dongList' | 'startFloor' | 'maxFloor' | 'unitsPerFloor'>[];
};