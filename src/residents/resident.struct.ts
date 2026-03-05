import * as s from 'superstruct';

export const CreateResidentStruct = s.object({
  name: s.size(s.string(), 1, 20),
  building: s.size(s.string(), 1, 10),
  unitNumber: s.size(s.string(), 1, 10),
  contact: s.pattern(s.string(), /^\d{10,11}$/),
  isHouseholder: s.enums(['HOUSEHOLDER', 'MEMBER']),
});

export const UpdateResidentStruct = s.partial(CreateResidentStruct);

export type CreateResidentDto = s.Infer<typeof CreateResidentStruct>;
export type UpdateResidentDto = s.Infer<typeof UpdateResidentStruct>;
