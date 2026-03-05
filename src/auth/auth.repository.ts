// src/auth/auth.repository.ts
import { prismaClient } from '../libs/constants';
import { Prisma, User } from '@prisma/client';

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
  };
}>;

export async function findUserForAuth(username: string): Promise<UserWIthApartment | null> {
  return (await prismaClient.user.findUnique({
    where: { username },
    include: {
      apartment: {
        include: {
          apartmentboard: {
            include: {
              notices: { take: 1, orderBy: { createdAt: 'desc' } },
              complaints: { take: 1, orderBy: { createdAt: 'desc' } },
              votes: { take: 1, orderBy: { createdAt: 'desc' } },
            },
          },
        },
      },
    },
  })) as UserWIthApartment | null;
}

export async function findUserById(id: string): Promise<UserWIthApartment | null> {
  return (await prismaClient.user.findUnique({
    where: { id },
    include: {
      apartment: {
        include: {
          apartmentboard: {
            include: {
              notices: { take: 1, orderBy: { createdAt: 'desc' } },
              complaints: { take: 1, orderBy: { createdAt: 'desc' } },
              votes: { take: 1, orderBy: { createdAt: 'desc' } },
            },
          },
        },
      },
    },
  })) as UserWIthApartment | null;
}
