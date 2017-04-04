import Process from 'process';

QUnit.module('tests/basic');



QUnit.test('can init new queues', function(assert) {
  assert.expect(4);
  let process = new Process(['q1', 'q2', 'q3']);
  let q1 = process.queuesObj['q1'].queueID;
  let q2 = process.queuesObj['q2'].queueID;
  let q3 = process.queuesObj['q3'].queueID;

  assert.equal('q1', q1, 'Should be the same');
  assert.equal('q2', q2, 'Should be the same');
  assert.equal('q3', q3, 'Should be the same');
  assert.notEqual('q1', q2, 'Should NOT be the same');
});



QUnit.test('can push work to the queue', function(assert) {
  assert.expect(1);
  let process = new Process(['q1']);
  process.scheduleWork('q1', null, () => {});
  process.scheduleWork('q1', null, () => {});

  let itemsLength = process.queuesObj[process.firstQueueID].getQueueLength();

  assert.equal(2, itemsLength, 'Should be the same');
});



QUnit.test('can flush work to the queue with arguments', function(assert) {
  assert.expect(1);
  let process = new Process(['q1']);
  let baseInt = 0;
  function addInt(int1: number, int2: number) {
    baseInt = int1 + int2;
  }

  process.scheduleWork('q1', null, addInt, [1, 2]);
  process.run();

  assert.equal(baseInt, 3, 'Should be the same');
});



QUnit.test('scheduleWork can stack with duplicates', function(assert) {
  assert.expect(1);
  let process = new Process(['q1']);
  let tasks = {
    one: { count: 0 }
  };

  function task1() {
    tasks.one.count++;
  }

  process.scheduleWork('q1', null, task1);
  process.scheduleWork('q1', null, task1);
  process.scheduleWork('q1', null, task1);
  process.run();
  assert.deepEqual(tasks, { one: { count: 3 }});
});



QUnit.test('scheduleWorkOnce will stack duplicates with most recent', function(assert) {
  assert.expect(1);
  let process = new Process(['q1']);
  let tasks = {
    one: { count: 0 }
  };

  function task1() {
    tasks.one.count++;
  }

  process.scheduleWorkOnce('q1', null, task1);
  process.scheduleWorkOnce('q1', null, task1);
  process.scheduleWorkOnce('q1', null, task1);
  process.run();
  assert.deepEqual(tasks, { one: { count: 1 }});
});



QUnit.test('schedule work on different queues', function(assert) {
  assert.expect(1);
  let process = new Process(['q1', 'q2', 'q3']);
  let tasks = {
    one: { count: 0 }
  };

  function task1() {
    tasks.one.count++;
  }

  process.scheduleWork('q1', null, task1);
  process.run();
  assert.deepEqual(tasks, { one: { count: 1 }});
});



QUnit.test('can pass work into run', function(assert) {
  assert.expect(1);
  let process = new Process(['q1']);
  let person = { name: '' };
  function updateName() {
    return person.name;
  }
  function setName(name) {
    person.name = name;
    process.scheduleWorkOnce('q1', null, updateName);
  }
  process.run(function() {
    setName('Kris');
    setName('Tom');
    setName('Yehuda');
  });

  assert.equal(person.name, 'Yehuda', 'Should be the same');
});
