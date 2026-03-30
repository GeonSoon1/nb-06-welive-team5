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
  ApartmentUnit
} from '@prisma/client';
import { hashPassword } from '../src/libs/auth/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Clean up database ---
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Cleaning up existing data...');
    await prisma.comment.deleteMany({});
    await prisma.voteRecord.deleteMany({});
    await prisma.voteOption.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.notice.deleteMany({});
    await prisma.complaint.deleteMany({});
    await prisma.vote.deleteMany({});
    await prisma.resident.deleteMany({});
    await prisma.user.updateMany({ data: { apartmentUnitId: null } });
    await prisma.apartmentUnit.deleteMany({});
    await prisma.apartmentStructureGroup.deleteMany({});
    await prisma.user.deleteMany({ where: { role: { not: 'SUPER_ADMIN' } } });

    const apartments = await prisma.apartment.findMany({});
    for (const apt of apartments) {
      await prisma.apartment.update({
        where: { id: apt.id },
        data: { adminId: null },
      });
    }
    await prisma.apartment.deleteMany({});
    await prisma.apartmentBoard.deleteMany({});

    await prisma.user.deleteMany({ where: { role: 'SUPER_ADMIN' } });
    console.log('🚮 Cleanup finished.');
  }

  const defaultPassword = await hashPassword('password123');
  const now = new Date();

  // --- 1. SUPER_ADMIN & ADMINS ---
  console.log('👤 Creating Admins...');
  await prisma.user.create({
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

  // 1번 아파트 관리자
  const admin = await prisma.user.create({
    data: {
      username: 'adminuser',
      password: defaultPassword,
      contact: '01011111111',
      name: '김관리',
      email: 'admin@welive.com',
      role: Role.ADMIN,
      joinStatus: JoinStatus.PENDING,
    },
  });

  // 2번 아파트 관리자
  const admin2 = await prisma.user.create({
    data: {
      username: 'adminuser2',
      password: defaultPassword,
      contact: '01022222222',
      name: '이관리',
      email: 'admin2@welive.com',
      role: Role.ADMIN,
      joinStatus: JoinStatus.REJECTED,
    },
  });

  // 3번 아파트 관리자
  const admin3 = await prisma.user.create({
    data: {
      username: 'adminuser3',
      password: defaultPassword,
      contact: '01033333333',
      name: '박관리',
      email: 'admin3@welive.com',
      role: Role.ADMIN,
      joinStatus: JoinStatus.NEED_UPDATE,
    },
  });

  // --- 2. APARTMENTS & BOARDS ---
  console.log('🏢 Creating Apartments and Boards...');

  // 1번 아파트: 웰라이브 아파트
  const apartmentBoard = await prisma.apartmentBoard.create({ data: {} });
  const apartment = await prisma.apartment.create({
    data: {
      name: '웰라이브 아파트',
      address: '서울시 강남구 테헤란로 427',
      officeNumber: '0212345678',
      description: '살기 좋은 웰라이브 아파트입니다.',
      apartmentStatus: ApartmentStatus.APPROVED,
      apartmentboardId: apartmentBoard.id,
      adminId: admin.id,
    },
  });
  await prisma.user.update({
    where: { id: admin.id },
    data: { apartmentId: apartment.id, joinStatus: JoinStatus.APPROVED },
  });

  // 2번 아파트: 센트럴 푸르지오
  const apartmentBoard2 = await prisma.apartmentBoard.create({ data: {} });
  const apartment2 = await prisma.apartment.create({
    data: {
      name: '센트럴 푸르지오',
      address: '경기도 성남시 분당구 판교역로 100',
      officeNumber: '0311112222',
      description: '자연과 함께하는 센트럴 푸르지오',
      apartmentStatus: ApartmentStatus.APPROVED,
      apartmentboardId: apartmentBoard2.id,
      adminId: admin2.id,
    },
  });
  await prisma.user.update({
    where: { id: admin2.id },
    data: { apartmentId: apartment2.id, joinStatus: JoinStatus.APPROVED },
  });

  // 3번 아파트: 더샵 스타시티
  const apartmentBoard3 = await prisma.apartmentBoard.create({ data: {} });
  const apartment3 = await prisma.apartment.create({
    data: {
      name: '더샵 스타시티',
      address: '부산광역시 해운대구 센텀중앙로 78',
      officeNumber: '0513334444',
      description: '최고급 주거환경 더샵 스타시티',
      apartmentStatus: ApartmentStatus.APPROVED,
      apartmentboardId: apartmentBoard3.id,
      adminId: admin3.id,
    },
  });
  await prisma.user.update({
    where: { id: admin3.id },
    data: { apartmentId: apartment3.id, joinStatus: JoinStatus.APPROVED },
  });

  // --- 3. STRUCTURE & UNITS ---
  console.log('🏗️ Creating Structure and Units for all apartments...');

  const targetApartments = [apartment, apartment2, apartment3];
  const units: ApartmentUnit[] = []; // 1번 아파트 유닛 배열 (유저 생성 로직 호환용)

  for (const apt of targetApartments) {
    await prisma.apartmentStructureGroup.create({
      data: {
        apartmentId: apt.id,
        dongList: '101동,102동',
        startFloor: 1,
        maxFloor: 5,
        unitsPerFloor: 2,
      },
    });

    for (const dong of ['101', '102']) {
      for (let floor = 1; floor <= 3; floor++) {
        for (let ho = 1; ho <= 2; ho++) {
          const unit = await prisma.apartmentUnit.create({
            data: {
              apartmentId: apt.id,
              dong,
              floor,
              ho: `${floor}0${ho}`,
            },
          });

          // 기존 유저 더미데이터가 '웰라이브 아파트(apartment)'를 기준으로 하므로
          // 1번 아파트의 유닛들만 기존 units 배열에 담아줍니다.
          if (apt.id === apartment.id) {
            units.push(unit);
          }
        }
      }
    }
  }

  // --- 4. USERS & RESIDENTS (웰라이브 아파트 기준) ---
  // --- 4. USERS & RESIDENTS (웰라이브 아파트 기준) ---
  console.log('👥 Creating Users and Residents...');
  const users = await Promise.all([
    // 1. 정상 승인된 세대주
    prisma.user.create({
      data: { username: 'user1', password: defaultPassword, contact: '01044441111', name: '이세대', email: 'u1@email.com', role: Role.USER, apartmentId: apartment.id, apartmentUnitId: units[0]!.id, joinStatus: JoinStatus.APPROVED },
    }),
    // 2. 정상 승인된 세대원 (번호 중복 해결)
    prisma.user.create({
      data: { username: 'user2', password: defaultPassword, contact: '01044442222', name: '김가족', email: 'u2@email.com', role: Role.USER, apartmentId: apartment.id, apartmentUnitId: units[1]!.id, joinStatus: JoinStatus.APPROVED },
    }),
    // 3. 정상 승인된 다른 동 세대주
    prisma.user.create({
      data: { username: 'user3', password: defaultPassword, contact: '01044443333', name: '박이웃', email: 'u3@email.com', role: Role.USER, apartmentId: apartment.id, apartmentUnitId: units[2]!.id, joinStatus: JoinStatus.APPROVED },
    }),
    // 4. 가입 대기 중인 유저
    prisma.user.create({
      data: { username: 'pendingUser', password: defaultPassword, contact: '01044444444', name: '최대기', email: 'p@email.com', role: Role.USER, apartmentId: apartment.id, apartmentUnitId: units[3]!.id, joinStatus: JoinStatus.PENDING },
    }),
    // 5. 가입 반려된 유저
    prisma.user.create({
      data: { username: 'rejectedUser', password: defaultPassword, contact: '01044445555', name: '정거절', email: 'r@email.com', role: Role.USER, apartmentId: apartment.id, apartmentUnitId: units[4]!.id, joinStatus: JoinStatus.REJECTED },
    }),
    // 6. 정보 수정 필요 유저
    prisma.user.create({
      data: { username: 'updateUser', password: defaultPassword, contact: '01044446666', name: '오수정', email: 'u@email.com', role: Role.USER, apartmentId: apartment.id, apartmentUnitId: units[5]!.id, joinStatus: JoinStatus.NEED_UPDATE },
    }),
  ]);
  // Residents 매핑
  const residentData = users.map((u, idx) => ({
    userId: u.id,
    apartmentId: apartment.id,
    dong: u.apartmentUnitId ? units.find(unit => unit.id === u.apartmentUnitId)!.dong : '101',
    ho: u.apartmentUnitId ? units.find(unit => unit.id === u.apartmentUnitId)!.ho : '101',
    name: u.name,
    contact: u.contact,
    isHouseholder: idx === 0 || idx === 2 ? HouseHolderStatus.HOUSEHOLDER : HouseHolderStatus.MEMBER,
    residenceStatus: u.joinStatus === JoinStatus.APPROVED ? ResidenceStatus.RESIDENCE : ResidenceStatus.NO_RESIDENCE,
  }));
  await prisma.resident.createMany({ data: residentData });

  // --- 5. NOTICES & EVENTS (다양한 공지 및 일정 연동) ---
  console.log('📢 Creating Notices and Events...');

  // 5-1. 긴급 공지 (일정 없음)
  await prisma.notice.create({
    data: {
      title: '[긴급] 단지 내 정전 안내', content: '한전 변압기 교체로 인해 약 30분간 정전이 발생합니다.',
      category: NoticeCategory.EMERGENCY, authorId: admin.id, apartmentboardId: apartmentBoard.id,
      isImportant: true, isSchedule: false,
    },
  });

  // 5-2. 일정 공지 (이벤트 자동 생성 시뮬레이션)
  const noticeSchedule = await prisma.notice.create({
    data: {
      title: '정기 소독 및 저수조 청소 안내', content: '6월 정기 소독 및 저수조 청소가 실시됩니다.',
      category: NoticeCategory.MAINTENANCE, authorId: admin.id, apartmentboardId: apartmentBoard.id,
      isImportant: false, isSchedule: true,
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 9, 0, 0),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 18, 0, 0),
    },
  });

  await prisma.event.create({
    data: {
      title: noticeSchedule.title, type: BoardType.NOTICE, category: NotificationType.NOTICE_REG,
      startDate: noticeSchedule.startDate!, endDate: noticeSchedule.endDate!,
      apartmentId: apartment.id, noticeId: noticeSchedule.id,
    }
  });

  // --- 6. COMPLAINTS (상태별 민원 및 댓글) ---
  console.log('🗣️ Creating Complaints...');

  // 6-1. 접수 대기 민원
  await prisma.complaint.create({
    data: { title: '101동 엘리베이터 소음', content: '엘리베이터 움직일 때마다 끼익 소리가 심합니다.', authorId: users[0].id, apartmentboardId: apartmentBoard.id, status: ComplaintStatus.PENDING, isPublic: true },
  });

  // 6-2. 처리 중 민원 + 관리자 댓글
  const complaintProg = await prisma.complaint.create({
    data: { title: '지하주차장 누수', content: '지하 1층 A구역 천장에서 물이 떨어집니다.', authorId: users[2].id, apartmentboardId: apartmentBoard.id, status: ComplaintStatus.IN_PROGRESS, isPublic: true },
  });
  await prisma.comment.create({
    data: { content: '현장 확인 완료하였으며, 보수 업체 배정 중입니다.', authorId: admin.id, complaintId: complaintProg.id }
  });

  // 6-3. 처리 완료 민원
  const complaintRes = await prisma.complaint.create({
    data: { title: '가로등 전구 교체 요망', content: '놀이터 옆 가로등이 나갔습니다.', authorId: users[1].id, apartmentboardId: apartmentBoard.id, status: ComplaintStatus.RESOLVED, isPublic: true },
  });
  await prisma.comment.create({
    data: { content: '전구 교체 완료했습니다. 감사합니다.', authorId: admin.id, complaintId: complaintRes.id }
  });

  // 6-4. 비공개 반려 민원
  await prisma.complaint.create({
    data: { title: '층간소음 해결해주세요', content: '윗집 발소리가 너무 큽니다.', authorId: users[0].id, apartmentboardId: apartmentBoard.id, status: ComplaintStatus.REJECTED, isPublic: false },
  });

  // --- 7. VOTES (상태별 투표 및 결과) ---
  console.log('🗳️ Creating Votes...');

  // 7-1. 진행 중 투표
  const voteInProgress = await prisma.vote.create({
    data: {
      title: '단지 내 헬스장 운영시간 연장 찬반 투표', content: '현재 22시까지인 운영시간을 24시까지 연장하는 것에 대한 투표입니다.', targetScope: 0,
      startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
      endDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5),
      status: VoteStatus.IN_PROGRESS, authorId: admin.id, apartmentboardId: apartmentBoard.id,
    },
  });
  const optIn1 = await prisma.voteOption.create({ data: { voteId: voteInProgress.id, content: '찬성', voteCount: 2 } });
  await prisma.voteOption.create({ data: { voteId: voteInProgress.id, content: '반대', voteCount: 0 } });

  await prisma.voteRecord.create({ data: { userId: users[0].id, voteId: voteInProgress.id, voteOptionId: optIn1.id } });
  await prisma.voteRecord.create({ data: { userId: users[1].id, voteId: voteInProgress.id, voteOptionId: optIn1.id } });

  // 7-2. 마감된 투표 (세대주만)
  const voteClosed = await prisma.vote.create({
    data: {
      title: '제3기 입주자대표회의 회장 선거', content: '회장 후보 투표입니다. (세대주 전용)', targetScope: 1,
      startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
      endDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
      status: VoteStatus.CLOSED, authorId: admin.id, apartmentboardId: apartmentBoard.id,
    },
  });
  const optCls1 = await prisma.voteOption.create({ data: { voteId: voteClosed.id, content: '기호 1번 이주민', voteCount: 1 } });
  const optCls2 = await prisma.voteOption.create({ data: { voteId: voteClosed.id, content: '기호 2번 박대표', voteCount: 1 } });
  await prisma.voteRecord.create({ data: { userId: users[0].id, voteId: voteClosed.id, voteOptionId: optCls1.id } });
  await prisma.voteRecord.create({ data: { userId: users[2].id, voteId: voteClosed.id, voteOptionId: optCls2.id } });

  // 7-3. 예정된 투표 (이벤트 등록)
  const votePending = await prisma.vote.create({
    data: {
      title: '재활용 쓰레기 수거일 변경 투표', content: '수거일을 화요일에서 목요일로 변경하는 안건입니다.', targetScope: 0,
      startDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
      endDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14),
      status: VoteStatus.PENDING, authorId: admin.id, apartmentboardId: apartmentBoard.id,
    },
  });
  await prisma.voteOption.createMany({
    data: [{ voteId: votePending.id, content: '찬성' }, { voteId: votePending.id, content: '반대' }]
  });
  await prisma.event.create({
    data: {
      title: '[투표예정] ' + votePending.title, type: BoardType.VOTE, category: NotificationType.VOTE_REG,
      startDate: votePending.startDate, endDate: votePending.endDate,
      apartmentId: apartment.id, voteId: votePending.id,
    }
  });


  // --- 8. NOTIFICATIONS ---
  console.log('🔔 Creating Notifications...');
  await prisma.notification.createMany({
    data: [
      { userId: admin.id, content: '새로운 가입 요청이 있습니다.', notificationType: NotificationType.SIGNUP_REQ },
      { userId: admin.id, content: '신규 민원이 접수되었습니다.', notificationType: NotificationType.COMPLAINT_REQ, complaintId: complaintProg.id },
      { userId: users[2].id, content: '접수하신 민원이 [처리 중] 상태로 변경되었습니다.', notificationType: NotificationType.COMPLAINT_IN_PROGRESS, complaintId: complaintProg.id },
      { userId: users[1].id, content: '접수하신 민원이 [처리 완료] 되었습니다.', notificationType: NotificationType.COMPLAINT_RESOLVED, complaintId: complaintRes.id, isChecked: true },
      { userId: users[0].id, content: '새로운 공지사항이 등록되었습니다.', notificationType: NotificationType.NOTICE_REG, noticeId: noticeSchedule.id },
      { userId: users[0].id, content: '참여하신 투표가 마감되었습니다.', notificationType: NotificationType.VOTE_CLOSED, voteId: voteClosed.id },
    ]
  });

  console.log('✅ Seeding finished successfully.');
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