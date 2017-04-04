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

  // init the flush of all tasks within the ACTIVE_QUEUE
  // and catch if error
  // once all tasks have been init then stop the flush
  // if tasks still remain on the queue flush again
  // the ACTIVE_QUEUE will continue to flush until empty
  public flush() {
    this.error = null;

    try {
      this._initTasks(this.queueItems);
    } catch (e) { this.error = e; }

    this.isScheduled = false;

    if (this.getQueueLength()) {
      this._scheduleFlush(this);
    }

    if (this.error) {
      throw new QueueError(this.error);
    }
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

  // calling all function tasks within the queue
  // conditionals for if the specific tasks is included scope and/or arguments
  // set the queue length
  // TODO: need to confirm this works with async functions
  private _initTasks(queueItems: IQueueWork[]) {
    for (let i = 0; i <= queueItems.length - 1; i++) {
      if (!queueItems[i].fnArgs) {
        queueItems[i].fn.call(queueItems[i].scope);
      }else {
        queueItems[i].fn.apply(queueItems[i].scope, queueItems[i].fnArgs);
      }
    }

    this._resetQueue(); // might need to remove this line
    this._setQueueLength();
  }

  // all work items have been flushed from the queue
  // so reset the queue to a default empty array
  private _resetQueue() {
    return this.queueItems = [];
  }

  // fully tested
  // @called Process.scheduleWorkOnce();
  // ensures a single function call
  // !might cause and out of order execution bug
  private _checkForExistingWork(work: IQueueWork) {
    function isDuplicate(item) {
      if (item.fn !== work.fn) {
        return item;
      }
    }
    this.queueItems = this.queueItems.filter(isDuplicate);
    this.pushWork(work);
  }

  // if the queue is not currently flushing
  // then schedule a flush
  // init the Queue.flush() within rAF
  private _scheduleFlush(scope) {
    if (!this.isScheduled) {
      this.isScheduled = true;
      requestAnimationFrame(this.flush.bind(null, this));
    }
  }

  private _setQueueLength() {
    return this.queueLength = this.queueItems.length;
  }
}
