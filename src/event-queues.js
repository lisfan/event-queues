/**
 * @file 事件队列管理
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.0.0
 * @licence MIT
 */

import validation from '@~lisfan/validation'
import Logger from '@~lisfan/logger'

// 存储主命名空间的常量
const PRIMARY_NAMESPACE = '__pri__'

const _actions = {
  /**
   * 分割队列命名空间
   *
   * @since 1.0.0
   *
   * @param {EventQueues} self - 本实本身
   * @param {string} queueName - 队列名称
   *
   * @returns {Array}
   */
  splitQueueName(self, queueName) {
    // 命名空间进行处理
    // 1. 处理空白符
    // 2. 处理.符号多个的场景
    // 3. 处理头和尾留有.符号的情况
    // 4. 处理子命名空间空白符
    const separator = self.$separator
    const uniqSeparatorRegExp = new RegExp(`\${separator}+`, 'g')
    // 提取中间内容
    const extractContentRegExp = new RegExp(`^\${separator}?(${separator}*?)\${separator}?$`)

    return queueName.trim()
    .replace(uniqSeparatorRegExp, separator)
    .replace(extractContentRegExp, '$1')
    .split(separator).map((name) => {
      return name.trim()
    })
  },
  /**
   * 初始化主命名空间集合
   *
   * @since 1.0.0
   *
   * @param {EventQueues} self - 本实本身
   * @param {string} namespace - 主命名空间
   *
   * @returns {object}
   */
  initMainNamespace(self, namespace) {
    return !validation.isPlainObject(self.$queues[namespace])
      ? {}
      : self.$queues[namespace]
  },
  /**
   * 初始化子命名空间集合
   *
   * @since 1.0.0
   *
   * @param {EventQueues} self - 本实本身
   * @param {string} mainNamespace - 主命名空间
   * @param {string} subNamespace - 子命名空间
   *
   * @returns {object}
   */
  initSubNamespace(self, mainNamespace, subNamespace) {
    return !validation.isPlainObject(self.$queues[mainNamespace][subNamespace])
      ? {
        events: [],
        isAsync: []
      }
      : self.$queues[mainNamespace][subNamespace]
  },
}

/**
 * @classdesc
 * 事件队列管理类
 *
 * @class
 */
class EventQueues {
  /**
   * 默认配置选项
   *
   * @since 1.0.0
   *
   * @static
   * @readonly
   * @memberOf EventQueues
   *
   * @property {boolean} debug=false - 打印器调试模式是否开启
   * @property {string} name='EventQueues' - 打印器名称标记
   * @property {string} separator='.' - 子命名空间分割符
   */
  static options = {
    debug: false,
    name: 'EventQueues',
    separator: '.'
  }

  /**
   * 更新默认配置选项
   *
   * @since 1.0.0
   *
   * @param {object} options - 配置选项
   * @param {boolean} [options.debug=false] - 打印器调试模式是否开启
   * @param {string} [options.name='EventQueues'] - 打印器名称标记
   * @param {string} [options.separator='.'] - 子命名空间分割符
   */
  static config(options) {
    EventQueues.options = {
      ...EventQueues.options,
      ...options
    }

    return EventQueues
  }

  /**
   * 构造函数
   *
   * @param {object} options - 配置选项
   * @param {boolean} [options.debug=false] - 打印器调试模式是否开启
   * @param {string} [options.name='EventQueues'] - 打印器名称标记
   * @param {string} [options.separator='.'] - 子命名空间分割符
   */
  constructor(options) {
    this.$options = {
      ...EventQueues.options,
      ...options
    }

    this._logger = new Logger({
      name: this.$options.name,
      debug: this.$options.debug
    })
  }

  /**
   * 日志打印器，方便调试
   *
   * @since 1.0.0
   *
   * @private
   */
  _logger = undefined

  /**
   * 实例配置项
   *
   * @since 1.0.0
   *
   * @readonly
   */
  $options = undefined

  /**
   * 事件队列集合
   *
   * @since 1.0.0
   *
   * @readonly
   */
  $queues = {}

  /**
   * 获取实例配置的分割符
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @returns {string}
   */
  get $separator() {
    return this.$options.separator
  }

  /**
   * 获取打印器实例的名称标记
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @returns {string}
   */
  get $name() {
    return this._logger.$name
  }

  /**
   * 获取实例的调试配置项
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @returns {boolean}
   */
  get $debug() {
    return this._logger.$debug
  }

  /**
   * 绑定队列事件
   *
   * @since 1.0.0
   *
   * @param {string} name - 命名空间名称，支持多个子命名空间，用'.'号分隔，如mainname1.subname2.subname3
   * @param {function} done - 事件
   * @param {boolean} [isAsync=false] - 是否为异步，如果是异步，则需要等待该事件执行完毕，再执行一个
   * 如果异步事件的执行结果不依赖与上一个的执行结果，则可以不传入该字段
   *
   * @returns {EventQueues}
   */
  on(name, done, isAsync = false) {
    // 处理空白符
    // 处理头和尾留有.符号的情况
    // 处理.符号多个的场景
    // 处理子命名空间空白符
    const queuesNameList = _actions.splitQueueName(this, name)
    const mainNamespace = queuesNameList[0]

    this.$queues[mainNamespace] = _actions.initMainNamespace(this, mainNamespace)

    // 如果事件只使用主命名空间定义，则定义在主命名空间下，
    // 如果事件使用了子命名空间定义，则同时定义在主命名空间和子命名空间下
    const queuesNamespaceList = [PRIMARY_NAMESPACE].concat(queuesNameList.slice(1))

    queuesNamespaceList.forEach((subQueueName) => {
      this.$queues[mainNamespace][subQueueName] = _actions.initSubNamespace(this, mainNamespace, subQueueName)

      const subQueue = this.$queues[mainNamespace][subQueueName]
      subQueue.events.push(done)
      subQueue.isAsync.push(!!isAsync)

      this._logger.log(`bind on success (${subQueueName})!`)
    })

    return this
  }

  /**
   * 移除队列事件
   *
   * @since 1.0.0
   *
   * @param {string} name - 命名空间名称，支持多个子命名空间，用'.'号分隔，如mainname1.subname2.subname3
   * @param {function} [done] - 移除指定的事件，若未指定，则移除该命名空间下所有事件队列
   *
   * @returns {EventQueues}
   */
  off(name, done) {
    const queuesNameList = _actions.splitQueueName(this, name)
    const mainNamespace = queuesNameList[0]

    // 该命名空间不存在
    if (!validation.isPlainObject(this.$queues[mainNamespace])) {
      this._logger.warn(`bind off faild! the (${mainNamespace}) main namespace is't exist.`)
      return this
    }

    // 如果是移除主命名空间，则移除所有该主命名空间下的事件队列主队列
    // 如果只移除子命名空间，则只移除该主命名空间下的该子命名空间
    const queuesNamespaceList = [PRIMARY_NAMESPACE].concat(queuesNameList.slice(1))

    // 如果queuesNamespaceList只有一项，则说明删除所有的事件队列
    if (queuesNamespaceList.length === 1) {
      // 存在命名空间
      if (validation.isFunction(done)) {
        // 指定了具体的事件时，只删除该指定的事件
        const subQueue = this.$queues[mainNamespace][PRIMARY_NAMESPACE]
        subQueue.events = subQueue.events.filter((cb) => {
          return cb === done
        })

        this._logger.log(`bind off success (${PRIMARY_NAMESPACE})!`)
      } else {
        this.$queues[mainNamespace] = null
        this._logger.log(`bind off success! remove all queues of the (${mainNamespace}) main namespace`)
      }

      return this
    }

    // 存在子命名空间时
    queuesNamespaceList.forEach((subQueueName) => {
      if (!validation.isPlainObject(this.$queues[mainNamespace][subQueueName])
        || !validation.isArray(this.$queues[mainNamespace][subQueueName].events)) {
        this._logger.warn(`bind off faild! the (${subQueueName}) sub namespace is't exist.`)
        return
      }

      // 存在命名空间
      if (validation.isFunction(done)) {
        // 指定了具体的事件时，只删除该指定的事件
        const subQueue = this.$queues[mainNamespace][subQueueName]

        // 会删除该命名空间下所有该指定的事件
        const isAsync = []
        subQueue.events = subQueue.events.filter((cb, index) => {
          if (cb === done) {
            isAsync.push(subQueue.isAsync[index])
            return true
          }
        })

        subQueue.isAsync = isAsync

        this._logger.log(`bind off success (${subQueueName})!`)
      } else {
        // 如果当前子命名空间是主命名空间不作删除
        if (subQueueName === PRIMARY_NAMESPACE) {
          return
        }

        this.$queues[mainNamespace][subQueueName] = null
        this._logger.log(`bind off success! remove all queues of the (${subQueueName}) sub namespace`)
      }
    })

    return this
  }

  /**
   * 执行队列事件，上一个队列项的执行结果将作为下一个队列项的参数传入
   *
   * @since 1.0.0
   *
   * @param {string} name - 命名空间名称，支持多个子命名空间，用'.'号分隔，如mainname1.subname2.subname3
   * @param {array} args - 参数列表，会将参数列表作为第一个事件队列的参数传入
   *
   * @returns {Promise}
   */
  emit(name, ...args) {
    return new Promise((resolve, reject) => {
      try {
        const queuesNameList = _actions.splitQueueName(this, name)
        const mainNamespace = queuesNameList[0]

        // 该命名空间不存在
        if (!validation.isPlainObject(this.$queues[mainNamespace])) {
          return resolve()
        }

        let queuesNamespaceList = queuesNameList.length === 1 ? [PRIMARY_NAMESPACE] : queuesNameList.slice(1)

        // 执行后的最后结果
        queuesNamespaceList.forEach((subQueueName) => {
          // 不存在，则不执行
          if (!validation.isPlainObject(this.$queues[mainNamespace][subQueueName])
            || !validation.isArray(this.$queues[mainNamespace][subQueueName].events)) {
            return resolve()
          }

          let execResult = this.$queues[mainNamespace][subQueueName].events.reduce((result, done, index) => {
            // 如果done不是函数，则将上一个结果继续返回
            if (!validation.isFunction(done)) {
              return result
            }

            return index === 0
              ? done.apply(null, args)
              : done.call(null, result)
          }, null)

          return resolve(execResult)
        })
      } catch (err) {
        return reject(err)
      }
    })
  }
}

export default EventQueues