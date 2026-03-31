
import { ExpressRequest, ExpressResponse, superstruct as s } from '../libs/constants';
import * as eventService from './event.services';
import {
    CreateEventQueryStruct,
    DeleteEventParamStruct,
    GetEventsQueryStruct
} from './event.struct';
import { CreateEventDto, GetEventsQuery } from './event.types';
// -todo query를 바로 받는것이 아닌 notice나 poll 처럼 한단계 완충이 필요함
// GET /api/event
export async function getEvents(req: ExpressRequest, res: ExpressResponse) {
    const query = s.create(req.query, GetEventsQueryStruct);
    const events = await eventService.getEventList(query);
    return res.status(200).json(events);
}

// PUT /api/event
export async function putEvent(req: ExpressRequest, res: ExpressResponse) {
    // API 명세에 따라 Query Parameter로 데이터를 받음
    const data = s.create(req.query, CreateEventQueryStruct);

    await eventService.createOrUpdateEvent(data);
    return res.status(204).send();
}

// DELETE /api/event/:eventId
export async function deleteEvent(req: ExpressRequest, res: ExpressResponse) {
    const { eventId } = s.create(req.params, DeleteEventParamStruct);

    const result = await eventService.deleteEvent(eventId);
    return res.status(200).json(result);
}
