import { IPublishSubscribeService, IEvent ,ISubscriber } from "./types";

export class PubSubService implements IPublishSubscribeService{
    private subscribers: Map<string, Set<ISubscriber>> = new Map();
    private eventQueue: IEvent[] = [];
    private isProcessing = false

    subscribe(type: string, handler: ISubscriber): () => void{
        if(!this.subscribers.has(type)){
            this.subscribers.set(type, new Set());
        }
        this.subscribers.get(type)!.add(handler);

        return ()=> this.unsubscribe(type, handler);
    }

    unsubscribe(type: string, handler: ISubscriber): void {
        const handlers = this.subscribers.get(type);
        if(handlers){
            handlers.delete(handler);
            if(handlers.size === 0){
                this.subscribers.delete(type);
            }
        }
    }
      publish(event: IEvent): void {
    this.eventQueue.push(event);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private processQueue(): void {
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      const handlers = this.subscribers.get(event.type());

      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler.handle(event);
          } catch (error) {
            console.error(`Error handling event ${event.type()}:`, error);
          }
        });
      }
    }

    this.isProcessing = false;
  }

}