import * as s from 'superstruct';
import { ResidenceStatus } from '@prisma/client';

export const CreateResidentStruct = s.object({
  name: s.size(s.string(), 1, 20),
  building: s.size(s.string(), 1, 10),
  unitNumber: s.size(s.string(), 1, 10),
  contact: s.pattern(s.string(), /^\d{10,11}$/),
  isHouseholder: s.enums(['HOUSEHOLDER', 'MEMBER']),
});

export const UpdateResidentStruct = s.partial(CreateResidentStruct);

export const GetResidentsQueryStruct = s.type({
  page: s.optional(s.string()),
  limit: s.optional(s.string()),
  building: s.optional(s.string()),
  unitNumber: s.optional(s.string()),
  residenceStatus: s.optional(s.enums(Object.keys(ResidenceStatus))),
  isRegistered: s.optional(s.enums(['true', 'false'])),
  keyword: s.optional(s.string()),
});

export type CreateResidentDto = s.Infer<typeof CreateResidentStruct>;
export type UpdateResidentDto = s.Infer<typeof UpdateResidentStruct>;
