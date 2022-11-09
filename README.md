Instructions
1. Build the Publish-Subscribe mechanism. Allow ISubscriber objects to register against an concrete IPublishSubscribService object for an event type. Implement the publish method so that when a publish event occurs, all subscribers of that the event type published will have a chance to handle the event. The subscribers should be working off a shared array of Machine objects, mutating them depending on the event received.
2. Now add the method 'unsubscribe' on IPublishSubscribeService to allow handlers to unsubscribe from events. You may change the existing method signatures.
3. Implement MachineRefillSubscriber. It will increase the stock quantity of the machine.
4. Introduce a new subscriber called LowStockWarningSubscriber. It subscribes to MachineSaleEvents. If a machine stock levels drops below 3 a new Event, LowStockWarningEvent should have a 50% chance of firing, which causes any future MachineSaleEvents to be ignored until the stock goes above 3 (by a MachineRefill event). Think about how you will communicate this information. Remember subscribers should be notified in the order of the events occured.

Your program should now allow you to create ISubscriber objects, register them using your IPublishSubscribService implementation. You can then create IEvent objects and call your IPublishSubscribService's implementations .publish() method. All handlers subscribed should have their 'handle' methods invoked.

These handlers should be able to create new events (LowStockWarningSubscriber), getting handled after the existing events are handled.

Note if subscribes subscribe after an event has already been published, they will not receive that event.

You may make any changes to this codebase as long as you ultimately build a Pub-Sub application capable of handling the existing machine sale and refill events.

Please share your work using a GitHub repository with @proftom.
