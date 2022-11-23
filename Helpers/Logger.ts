import { Context } from '@azure/functions';

export default class Logger {
    private _context: Context;

    constructor(context: Context) {
        this._context = context;
    }

    public log(message: any) {
        this._context.log(message);
    }

    public logWarn(message: any): void {
        this._context.log.warn(message);
    }

    public logError(message: any) {
        this._context.log.error(message);
    }
}