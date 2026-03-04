import { ExpressHandler, ExpressRequest, ExpressResponse, ExpressNextFunction } from './constants';

export const catchAsync = (fn: ExpressHandler): ExpressHandler => {
    return (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export const catchAsyncAll = (...fns: ExpressHandler[]): ExpressHandler[] => {
    return fns.map(catchAsync);
};