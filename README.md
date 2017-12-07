# event-queues

## 事件队列管理

[API documentation](https://lisfan.github.io/event-queues/)

## Feature 特性

- 支持多个子命名空间事件队列管理
- 支持队列中的异步事件以同步方式执行（未完成）

## Detail 详情

- 绑定在某个子命名空间上的事件，会同时绑定在主命名空间上
- 移除主命名空间上的队列时，会移除该命名空间下所有的事件队项
- 移除子命名空间上的队列时，只移除该子命名空间下的事件队列，并不影响当时填加到主命名空间下的事件队列
- 执行命名空间上的队列时，会按顺序执行事件，调用时传入的所有参数会作为第一个事件的参数，之后该事件的执行结果会作为下一个事件的参数提供，所有队列执行完毕后，返回Promise

## Install 安装

```bash
npm install -S @~lisfan/event-queues
```

## Usage 起步

```js
import EventQueues from '@~lisfan/eventQueues'

const eventQueues = new EventQueues({
  debug: true, // 开始日志调式，默认false
  name: 'custom', // 设置日志器名称标记，默认值为'EventQueues'
  separator: '.', // 子命名空间的分割符，默认'.'
})

// 绑定主命名空间
eventQueues.on('name', (val) => {
  console.log('name', val)
})
// 绑定具体的子命名空间
eventQueues.on('name.subname', (preResult) => {
  console.log('name.subname', preResult)
})

// 绑定多个具体的子命名空间
eventQueues.on('name.subname.subname2', (preResult) => {
  console.log('name.subname.subname2', preResult)
})

// 指定事件函数
const specFun = () => {
  console.log('specFun')
}

// 绑定指定事件
eventQueues.on('name.subname3', specFun)

// 移除该子命名空间下指定事件队列项
eventQueues.off('name.subname3', specFun)

// 移除该子命名空间下所有队列
eventQueues.off('name.subname')

// 执行主命名空间下的队列事件
eventQueues.emit('name', 'firstArg', 'secondArg').then((result) => {
  console.log('emit result', result)
})
```

