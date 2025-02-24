import { IEvent } from './IEvent';

interface ISubscriber {
    handle(event: IEvent): void;
}

export { ISubscriber }
