import Queue from './process/queue';
import QueueError from './process/queue-error';

export default class Process {

  public ACTIVE_QUEUE: null | Queue = null;
  public CURRENT_QUEUE: null | Queue = null;
  public options: Object = {};
  public queuesObj: Object = {};
  public firstQueueID: string;
  private isAllQueuesEmpty: boolean = false;

  constructor(_queueIDArray: string[], options?: any) {
    this.options = options;
    this._initQueues(_queueIDArray);
    this.firstQueueID = Object.keys(this.queuesObj)[0];
    this.ACTIVE_QUEUE = this.queuesObj[this.firstQueueID];
  }

  // fully tested
  // iterate over all the queues looking for a specified queueID
  // if its a match then push work to be processed on its queue
  // else throw an error that the passed queueID doesnt match any existing queues
  // will schedule duplicate tasks if instantiated to do so will NOT deferWork
  public scheduleWork(queueID: string, scope: any, fn: Function, fnArgs?: any[]) {
    if (this.queuesObj[queueID].queueID) {
      this.queuesObj[queueID].pushWork({scope, fn, fnArgs});
    }else {
      throw new QueueError('Queue ID not found. Please push work to a valid exisiting queue.');
    }
  }

  // fully tested
  // iterate over all the queues looking for a specified queueID
  // if its a match then push work to be processed on its queue
  // else throw an error that the passed queueID doesnt match any existing queues
  // will schedule duplicate tasks if instantiated to do so will NOT deferWork
  public scheduleWorkOnce(queueID: string, scope: any, fn: Function, fnArgs?: any[]) {
    if (this.queuesObj[queueID].queueID) {
      this.queuesObj[queueID]._checkForExistingWork({scope, fn, fnArgs});
    }else {
      throw new QueueError('Queue ID not found. Please push work to a valid exisiting queue.');
    }

  }

  // if a function is passed into run then schedule the work
  // into the first queue to flush first
  // if all the queues are empty return
  // else init the current and active queue then flush it
  // this is the begining of the process/loop/run etc.
  public run(fn?: Function) {
    if (!fn) {
      if (this.isAllQueuesEmpty) { return; }
    }else {
      this.scheduleWork(Object.keys(this.queuesObj)[0], null, fn);
    }

    this._setCurrentQueue();
    this._setActiveQueue();
    this._flushActiveQueue();
  }

  // the queue as a POJO
  private _initQueues(_queueIDArray: string[]) {
    let scope = this;
    _queueIDArray.forEach(function(queueID) {
      scope.queuesObj[queueID] = new Queue(queueID);
    });
  }

  // get the number of total queues
  // see if work is waiting to flush on each queue
  // iterate last to first maintaining queue process order
  // CURRENT_QUEUE is the first queue with work waiting to flush
  private _setCurrentQueue() {
    let i = 0;
    let ii = Object.keys(this.queuesObj).length - 1;
    let _queueId: string | null = null;

    while (i <= ii) {
      _queueId = Object.keys(this.queuesObj)[i];
      if (this.queuesObj[_queueId].getQueueLength()) {
        this.CURRENT_QUEUE = this.queuesObj[_queueId];
      }
      i++;
    }
   }

  // if the CURRENT_QUEUE is truthy its a Queue
  // if all the queues have been flushed and no work is waiting on any queue
  // default the CURRENT_QUEUE and the ACTIVE_QUEUE because the run is over
  // otherwise set the CURRENT_QUEUE to the ACTIVE_QUEUE
  private _setActiveQueue() {
    if (this.CURRENT_QUEUE) {
      if (this.isAllQueuesEmpty) {
        this.CURRENT_QUEUE = null;
      }
      this.ACTIVE_QUEUE = this.CURRENT_QUEUE;
    }
  }

  // if the ACTIVE_QUEUE is truthy its a Queue with work waiting to be flushed
  // call flush on the ACTIVE_QUEUE (Queue.flush())
  // start all over again
  private _flushActiveQueue() {
    if (this.ACTIVE_QUEUE) {
      this.ACTIVE_QUEUE.flush();

      // kick it all off again
      // this.run();
    }
  }
};
