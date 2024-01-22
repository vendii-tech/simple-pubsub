import { IEvent } from './interfaces/event'
import { IPublishSubscribeService } from './interfaces/publish.subscribe.service'
import { ISubscriber } from './interfaces/subscriber'
import { EventType } from './enums/event.types'
import { MachineRefillSubscriber } from './machines/refill.subscriber'
import { MachineSaleSubscriber } from './machines/sale.subscriber'
import { MachineStockSubscriber } from './machines/stock.subscriber'
import { Machine } from './machines/data'

class PubSubService implements IPublishSubscribeService {

    subscribers: Record<string, ISubscriber>
  
    constructor() {
      this.subscribers = Object.create({})
    }
  
    publish (event: IEvent): void {
      this.subscribers[event.type()] ?
        setTimeout(() => this.subscribers[event.type()].handle(event)) :
        console.error(new Error(event.type() + ' not implemented'))
    }
  
    subscribe (type: string, handler: ISubscriber): void {
      this.subscribers[type] = handler
    }
  
    unsubscribe(type: string): void {
      delete this.subscribers[type]
    }
  
  }
  

  export default ((machines: Machine[]) => {
    const pubSubService = new PubSubService()

    // create a machine sale event subscriber. inject the machines (all subscribers should do this)
    const saleSubscriber = new MachineSaleSubscriber(machines, pubSubService);
    const refillSubscriber = new MachineRefillSubscriber(machines, pubSubService)
    const stockSubscriber = new MachineStockSubscriber(machines)

    pubSubService.subscribe(EventType.SALE, saleSubscriber)
    pubSubService.subscribe(EventType.REFILL, refillSubscriber)
    pubSubService.subscribe(EventType.STOCK, stockSubscriber)

    // pubSubService.unsubscribe('sale')

    // setTimeout(() => { console.log(machines) }, 1000)

    return pubSubService
  })