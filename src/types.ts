export interface IEvent{
    type(): string;
    machineId(): string;
}

export interface ISubscriber{
    handle(event: IEvent): void;
}

export interface IPublishSubscribeService{
    publish(event: IEvent): void;
    subscribe(type: string, handle: ISubscriber):() => void;
    unsubscribe(type: string, handler: ISubscriber): void;
}