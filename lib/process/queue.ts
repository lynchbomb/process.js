import QueueError from './queue-error';

interface IQueueWork {
  scope?: any;
  fn: Function;
  fnArgs?: any[];
}

export default class Queue {
  public queueLength: number = 0;
  public queueID: string;
  public queueItems: any[] = [];
  public isScheduled: boolean = false;
  public error: any;

  constructor(queueID: string) {
    this.queueID = queueID;
  }

  // fully tested
  // @called Process.scheduleWorkOnce();
  // ensures a single function call
  // !might cause and out of order execution bug
  public checkForExistingWork(work: IQueueWork) {
    function isDuplicate(item) {
      if (item.fn !== work.fn) {
        return item;
      }
    }
    this.queueItems = this.queueItems.filter(isDuplicate);
    this.pushWork(work);
  }

  // fully tested
  // @caller Process.pushWorkToQueue();
  public pushWork(work: IQueueWork) {
    this.queueItems.push(work);
    this._setQueueLength();
  }

  // fully tested
  public getQueueLength() {
    return this.queueLength;
  }

  // if the queue is not currently flushing
  // then schedule a flush
  // init the Queue.flush() within rAF
  public scheduleFlush(scope) {
    if (!this.isScheduled) {
      this.isScheduled = true;
      requestAnimationFrame(this.flush.bind(null, this));
    }
  }

  // init the flush of all tasks within the ACTIVE_QUEUE
  // and catch if error
  // once all tasks have been init then stop the flush
  // if tasks still remain on the queue flush again
  // the ACTIVE_QUEUE will continue to flush until empty
  public flush() {
    this.error = null;

    try {
      this.initTasks(this.queueItems);
    } catch (e) { this.error = e; }

    this.isScheduled = false;

    if (this.getQueueLength()) {
      this.scheduleFlush(this);
    }

    if (this.error) {
      throw new QueueError(this.error);
    }
  }

  // calling all function tasks within the queue
  // conditionals for if the specific tasks is included scope and/or arguments
  // set the queue length
  public initTasks(queueItems: IQueueWork[]) {
    for (let i = 0; i <= queueItems.length - 1; i++) {
      if (!queueItems[i].fnArgs) {
        queueItems[i].fn.call(queueItems[i].scope);
      }else {
        queueItems[i].fn.apply(queueItems[i].scope, queueItems[i].fnArgs);
      }
    }
    this.queueItems = []; // might need to remove this line
    this._setQueueLength();
  }

  private _setQueueLength() {
    return this.queueLength = this.queueItems.length;
  }
}
