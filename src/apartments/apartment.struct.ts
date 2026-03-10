import * as s from 'superstruct';

export const ApartmentDetailResponseStruct = s.object({
  id: s.string(),
  name: s.nonempty(s.string()),
  address: s.nonempty(s.string()),
  officeNumber: s.string(),
  description: s.optional(s.string()),
  apartmentStatus: s.string(),

  structureGroups: s.array(
    s.object({
      dongList: s.string(),
      startFloor: s.integer(),
      maxFloor: s.integer(),
      unitsPerFloor: s.integer(),
    }),
  ),
});

export const IdParamsStruct = s.object({
  id: s.nonempty(s.string()),
});