import { Prisma, User, ApartmentStatus, Role, JoinStatus } from '@prisma/client';


export type SignupAdminResponse = Pick<User, 'id' | 'name' | 'email' | 'role' | 'joinStatus'> & {
  isActive: boolean;
};


export type SignupSuperAdminResponse = Pick<
  User,
  'id' | 'name' | 'email' | 'role' | 'joinStatus'
> & { isActive: boolean };


export type SignupUserResponse = Pick<User, 'id' | 'name' | 'email' | 'role' | 'joinStatus'> & {
  isActive: boolean;
};

export type CreateSuperAdminParams = {
  username: string;
  hashedPassword: string;
  contact: string;
  name: string;
  email: string;
};

// User 타입 + Apartment 타입 + ApartmentUnit 타입
export type UserWIthApartment = Prisma.UserGetPayload<{
  include: {
    apartment: {
      include: {
        apartmentboard: {
          include: {
            notices: true;
            complaints: true;
            votes: true;
          };
        };
      };
    };
    apartmentUnit: true;
  };
}>;

export type LoginResponse = {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinStatus: JoinStatus;
  isActive: boolean;
  username: string;
  contact: string;
  avatar: string | null;
  apartmentId: string | null;
  apartmentName: string | null;
  residentDong: string | null;
  boardIds: {
    COMPLAINT?: string;
    NOTICE?: string;
    POLL?: string;
  } | null;
}

export type LoginInput = {
  username: string;
  password: string;
}

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
}