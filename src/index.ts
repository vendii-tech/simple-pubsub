import { Machine } from './Machine';
import { PubSubService } from './PubSubService';
import { MachineSaleEvent, MachineRefillEvent } from './events';
import {
  MachineSaleSubscriber,
  MachineRefillSubscriber,
  StockWarningSubscriber
} from './subscribers';
import { eventGenerator } from './helpers';

(async () => {
  const machines: Machine[] = [
    new Machine('001'),
    new Machine('002'),
    new Machine('003')
  ];

  const pubSubService = new PubSubService();

  const saleSubscriber = new MachineSaleSubscriber(machines, pubSubService);
  
  const refillSubscriber = new MachineRefillSubscriber(machines, pubSubService);
  
  const warningSubscriber = new StockWarningSubscriber();

  pubSubService.subscribe('sale', saleSubscriber);
  pubSubService.subscribe('refill', refillSubscriber);
  pubSubService.subscribe('low-stock-warning', warningSubscriber);
  pubSubService.subscribe('stock-level-ok', warningSubscriber);

  console.log('=== Initial State ===');
  machines.forEach(m => console.log(`Machine ${m.id}: ${m.stockLevel} items`));
  console.log('');

  const events = [1, 2, 3, 4, 5].map(i => eventGenerator());

  events.forEach(event => pubSubService.publish(event));

  console.log('');
  console.log('=== Final State ===');
  machines.forEach(m => {
    console.log(`Machine ${m.id}: ${m.stockLevel} items ${m.isLowStock ? '⚠️' : '✓'}`);
  });

  console.log('');
  console.log('=== Testing Unsubscribe ===');
  pubSubService.unsubscribe('sale', saleSubscriber);
  console.log('Sale subscriber unsubscribed');
  pubSubService.publish(new MachineSaleEvent(1, '001'));
  console.log('^ Sale event was ignored (no subscriber)');
})();