import { IEvent } from './interfaces/event'
import { MachineSaleEvent } from './machines/sale.event'
import { MachineRefillEvent } from './machines/refill.event'
import { Machine } from './machines/data'
import PubSubService from './pub-sub.service'

// helpers
const randomMachine = (): string => {
  const random = Math.random() * 3;
  if (random < 1) {
    return '001';
  } else if (random < 2) {
    return '002';
  }
  return '003';
}

const eventGenerator = (): IEvent => {
  const random = Math.random();
  if (random < 0.5) {
    const saleQty = Math.random() < 0.5 ? 1 : 2; // 1 or 2
    return new MachineSaleEvent(saleQty, randomMachine());
  } 
  const refillQty = Math.random() < 0.5 ? 3 : 5; // 3 or 5
  return new MachineRefillEvent(refillQty, randomMachine());
}


// program
(async () => {
  // create 3 machines with a quantity of 10 stock
  const machines: Machine[] = [ new Machine('001'), new Machine('002'), new Machine('003') ];

  const pubSubService = PubSubService(machines)
  // create 5 random events
  const events = [1,2,3,4,5].map(i => eventGenerator());

  // publish the events
  events.map(pubSubService.publish.bind(pubSubService));
})();
