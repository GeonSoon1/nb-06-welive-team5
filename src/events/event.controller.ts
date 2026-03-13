
import { ExpressRequest, ExpressResponse, superstruct as s } from '../libs/constants';
import * as eventService from './event.services';
import {
    CreateEventQueryStruct,
    DeleteEventParamStruct,
    GetEventsQueryStruct
} from './event.struct';
import { CreateEventDto, GetEventsQuery } from './event.types';

// GET /api/event
export async function getEvents(req: ExpressRequest, res: ExpressResponse) {
    const query = s.create(req.query, GetEventsQueryStruct) as unknown as GetEventsQuery;
    const events = await eventService.getEventList(query);
    return res.status(200).json(events);
}

// PUT /api/event
export async function putEvent(req: ExpressRequest, res: ExpressResponse) {
    // API 명세에 따라 Query Parameter로 데이터를 받음
    const data = s.create(req.query, CreateEventQueryStruct) as unknown as CreateEventDto;

    await eventService.createOrUpdateEvent(data);
    return res.status(204).send();
}

// DELETE /api/event/:eventId
export async function deleteEvent(req: ExpressRequest, res: ExpressResponse) {
    const { eventId } = s.create(req.params, DeleteEventParamStruct);

    const result = await eventService.deleteEvent(eventId);
    return res.status(200).json(result);
}
