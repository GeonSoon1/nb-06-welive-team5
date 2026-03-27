
import {
  PrismaClient,
  Role,
  ApartmentStatus,
  JoinStatus,
  ResidenceStatus,
  HouseHolderStatus,
  NoticeCategory,
  ComplaintStatus,
  VoteStatus,
  BoardType,
  NotificationType,
} from '@prisma/client';
import { hashPassword } from '../src/libs/auth/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Clean up database ---
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Cleaning up existing data...');
    // Order of deletion matters to avoid foreign key constraints
    await prisma.comment.deleteMany({});
    await prisma.voteRecord.deleteMany({});
    await prisma.voteOption.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.notice.deleteMany({});
    await prisma.complaint.deleteMany({});
    await prisma.vote.deleteMany({});
    await prisma.resident.deleteMany({});
    await prisma.apartmentUnit.deleteMany({});
    await prisma.apartmentStructureGroup.deleteMany({});
    await prisma.user.deleteMany({ where: { role: { not: 'SUPER_ADMIN' } } });

    // We handle apartment and apartment board deletion carefully
    const apartments = await prisma.apartment.findMany({});
    for (const apt of apartments) {
      await prisma.apartment.update({
        where: { id: apt.id },
        data: { adminId: null },
      });
    }
    await prisma.apartment.deleteMany({});
    await prisma.apartmentBoard.deleteMany({});

    // Super admin might be special, handle separately if needed or recreate
    await prisma.user.deleteMany({ where: { role: 'SUPER_ADMIN' } });
    console.log('🚮 Cleanup finished.');
  } else {
    console.log('🚫 Skipping cleanup in production environment.');
  }


  // --- Hashed Password ---
  const defaultPassword = await hashPassword('password123');

  // --- Create SUPER_ADMIN ---
  console.log('👤 Creating SUPER_ADMIN...');
  const superAdmin = await prisma.user.create({
    data: {
      username: 'superadmin',
      password: defaultPassword,
      contact: '010-0000-0000',
      name: '총관리자',
      email: 'super@admin.com',
      role: Role.SUPER_ADMIN,
      joinStatus: JoinStatus.APPROVED,
    },
  });

  // --- Create Apartment Admin ---
  console.log('👤 Creating ADMIN...');
  const admin = await prisma.user.create({
    data: {
      username: 'adminuser',
      password: defaultPassword,
      contact: '010-1111-1111',
      name: '김관리',
      email: 'admin@welive.com',
      role: Role.ADMIN,
      joinStatus: JoinStatus.PENDING, // Will be approved after apartment assignment
    },
  });

  // --- Create Apartment & Board ---
  console.log('🏢 Creating Apartment and Board...');
  const apartmentBoard = await prisma.apartmentBoard.create({
    data: {},
  });

  const apartment = await prisma.apartment.create({
    data: {
      name: '웰라이브 아파트',
      address: '서울시 강남구 테헤란로 427',
      officeNumber: '02-1234-5678',
      description: '살기 좋은 웰라이브 아파트입니다.',
      apartmentStatus: ApartmentStatus.APPROVED,
      apartmentboardId: apartmentBoard.id,
      adminId: admin.id,
    },
  });

  // --- Create Apartment Structure & Units ---
  console.log('🏗️ Creating Apartment Structure and Units...');
  await prisma.apartmentStructureGroup.create({
    data: {
      apartmentId: apartment.id,
      dongList: '101동,102동',
      startFloor: 1,
      maxFloor: 20,
      unitsPerFloor: 4,
    },
  });

  const unit101_101 = await prisma.apartmentUnit.create({
    data: { apartmentId: apartment.id, dong: '101', floor: 1, ho: '101' },
  });
  const unit101_102 = await prisma.apartmentUnit.create({
    data: { apartmentId: apartment.id, dong: '101', floor: 1, ho: '102' },
  });
  const unit102_201 = await prisma.apartmentUnit.create({
    data: { apartmentId: apartment.id, dong: '102', floor: 2, ho: '201' },
  });


  // --- Update Admin user with apartment info ---
  await prisma.user.update({
    where: { id: admin.id },
    data: {
      apartmentId: apartment.id,
      joinStatus: JoinStatus.APPROVED,
    },
  });

  // --- Create Regular Users ---
  console.log('👥 Creating regular USERs...');
  const user1 = await prisma.user.create({
    data: {
      username: 'user1',
      password: defaultPassword,
      contact: '010-1234-5671',
      name: '이주민',
      email: 'user1@email.com',
      role: Role.USER,
      apartmentId: apartment.id,
      apartmentUnitId: unit101_101.id,
      joinStatus: JoinStatus.APPROVED,
    },
  });
  const user2 = await prisma.user.create({
    data: {
      username: 'user2',
      password: defaultPassword,
      contact: '010-1234-5672',
      name: '박세대',
      email: 'user2@email.com',
      role: Role.USER,
      apartmentId: apartment.id,
      apartmentUnitId: unit101_102.id,
      joinStatus: JoinStatus.APPROVED,
    },
  });
  const user3 = await prisma.user.create({
    data: {
      username: 'user3',
      password: defaultPassword,
      contact: '010-1234-5673',
      name: '최세대',
      email: 'user3@email.com',
      role: Role.USER,
      apartmentId: apartment.id,
      apartmentUnitId: unit102_201.id,
      joinStatus: JoinStatus.APPROVED,
    },
  });

  // --- Create Residents ---
  console.log('🏡 Creating Residents...');
  await prisma.resident.createMany({
    data: [
      {
        dong: '101', ho: '101', name: '이주민', contact: '010-1234-5671',
        isHouseholder: HouseHolderStatus.HOUSEHOLDER, userId: user1.id, apartmentId: apartment.id,
        residenceStatus: ResidenceStatus.RESIDENCE,
      },
      {
        dong: '101', ho: '102', name: '박세대', contact: '010-1234-5672',
        isHouseholder: HouseHolderStatus.HOUSEHOLDER, userId: user2.id, apartmentId: apartment.id,
        residenceStatus: ResidenceStatus.RESIDENCE,
      },
      {
        dong: '102', ho: '201', name: '최세대', contact: '010-1234-5673',
        isHouseholder: HouseHolderStatus.HOUSEHOLDER, userId: user3.id, apartmentId: apartment.id,
        residenceStatus: ResidenceStatus.RESIDENCE,
      },
    ],
  });

  // --- Create Notices ---
  console.log('📢 Creating Notices...');
  const notice1 = await prisma.notice.create({
    data: {
      title: '정기 소독 안내 (6월)',
      content: '아파트 전체 정기 소독이 6월 25일에 실시될 예정입니다. 각 세대에서는 협조 부탁드립니다.',
      category: NoticeCategory.MAINTENANCE,
      authorId: admin.id,
      apartmentboardId: apartmentBoard.id,
      isImportant: true,
      isSchedule: true,
      startDate: new Date('2026-06-25T09:00:00Z'),
      endDate: new Date('2026-06-25T17:00:00Z'),
    },
  });

  const notice2 = await prisma.notice.create({
    data: {
      title: '커뮤니티 센터 이용 시간 변경 안내',
      content: '7월 1일부터 커뮤니티 센터(헬스장, 독서실) 이용 시간이 06:00 ~ 23:00로 변경됩니다.',
      category: NoticeCategory.COMMUNITY,
      authorId: admin.id,
      apartmentboardId: apartmentBoard.id,
    },
  });


  // --- Create Complaints ---
  console.log('🗣️ Creating Complaints...');
  const complaint1 = await prisma.complaint.create({
    data: {
      title: '101동 앞 가로등이 깜빡거립니다.',
      content: '밤에 다닐 때 불편합니다. 빠른 수리 부탁드립니다.',
      authorId: user1.id,
      apartmentboardId: apartmentBoard.id,
      isPublic: true,
      status: ComplaintStatus.PENDING,
    }
  });

  // --- Create Votes ---
  console.log('🗳️ Creating Votes...');
  const vote1 = await prisma.vote.create({
    data: {
      title: '놀이터 바닥 교체 공사 찬반 투표',
      content: '아이들의 안전을 위해 노후화된 놀이터 바닥을 우레탄으로 교체하는 공사에 대한 주민 여러분의 의견을 묻습니다.',
      targetScope: 0, // 0: 전체, 1: 세대주
      startTime: new Date('2026-07-01T00:00:00Z'),
      endTime: new Date('2026-07-15T23:59:59Z'),
      status: VoteStatus.IN_PROGRESS,
      authorId: admin.id,
      apartmentboardId: apartmentBoard.id,
    },
  });

  const voteOption1_1 = await prisma.voteOption.create({
    data: { voteId: vote1.id, content: '찬성' },
  });
  const voteOption1_2 = await prisma.voteOption.create({
    data: { voteId: vote1.id, content: '반대' },
  });

  // --- Create Vote Records ---
  console.log('✍️ Creating Vote Records...');
  await prisma.voteRecord.create({
    data: { userId: user1.id, voteId: vote1.id, voteOptionId: voteOption1_1.id },
  });
  await prisma.voteRecord.create({
    data: { userId: user2.id, voteId: vote1.id, voteOptionId: voteOption1_1.id },
  });
  await prisma.voteRecord.create({
    data: { userId: user3.id, voteId: vote1.id, voteOptionId: voteOption1_2.id },
  });

  await prisma.voteOption.update({
    where: { id: voteOption1_1.id },
    data: { voteCount: { increment: 2 } },
  });

  await prisma.voteOption.update({
    where: { id: voteOption1_2.id },
    data: { voteCount: { increment: 1 } },
  });

  // --- Create Comments ---
  console.log('💬 Creating Comments...');
  await prisma.comment.create({
    data: {
      content: '항상 수고 많으십니다. 확인 부탁드려요!',
      authorId: user1.id,
      complaintId: complaint1.id,
    }
  });
  await prisma.comment.create({
    data: {
      content: '안전이 최우선이죠. 찬성합니다.',
      authorId: user2.id,
      voteId: vote1.id,
    }
  });

  // --- Create Notifications ---
  console.log('🔔 Creating Notifications...');
  await prisma.notification.create({
    data: {
      content: `새로운 민원 [${complaint1.title}]이 등록되었습니다.`,
      notificationType: NotificationType.COMPLAINT_REQ,
      userId: admin.id,
      complaintId: complaint1.id
    }
  });
  await prisma.notification.create({
    data: {
      content: `새로운 공지 [${notice2.title}]가 등록되었습니다.`,
      notificationType: NotificationType.NOTICE_REG,
      userId: user1.id,
      noticeId: notice2.id
    }
  });


  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error('❌ An error occurred while seeding the database:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

