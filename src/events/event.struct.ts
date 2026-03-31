import { superstruct as s } from '../libs/constants';

// String -> Number 변환
const StringToNumber = s.coerce(s.number(), s.string(), (value) => Number(value));

// String -> Date 변환
const StringToDate = s.coerce(s.date(), s.string(), (value) => new Date(value));

export const GetEventsQueryStruct = s.object({
    apartmentId: s.string(),
    year: StringToNumber,
    month: StringToNumber,
});

export const CreateEventQueryStruct = s.object({
    boardType: s.enums(['NOTICE', 'POLL']),
    boardId: s.string(),
    startDate: StringToDate,
    endDate: StringToDate,
});

export const DeleteEventParamStruct = s.object({
    eventId: s.string(),
});
