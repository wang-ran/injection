import { ObjectIdentifier, IErrorChainItem } from '../interfaces';
import { STACK_OVERFLOW, CIRCULAR_DEPENDENCY } from './errMsg';

export class NotFoundError extends Error {
  constructor(identifier: ObjectIdentifier) {
    super(identifier);
  }
}

export function isStackOverflowExeption(error: Error): boolean {
  return error instanceof RangeError || error.message === STACK_OVERFLOW;
}

export function isNotFoundExeption(error: Error): boolean {
  return error instanceof NotFoundError;
}

export class ErrorChainItem implements IErrorChainItem {
  identifier: string;
  error: Error;
  constructor(identifier?: string, error?: Error) {
    if (identifier && error) {
      this.identifier = identifier;
      this.error = error;
    }
  }
}

/**
 * 适用于记录递归调用时发生错误的调用顺序
 * 若要记录发生错误时递归调用链,请保证递归调用时将最初 error 对象抛出,不要新生成 error 对象
 * container.get 是深度优先的递归获取, ErrorChain 类用来记录此方法发生错误时的调用链
 * 使用 WeakMap 来记录错误信息, key 是 error 对象, value 是 ErrorChainItem 的实例
 * 由于 error 作为 key, 同一个 error 对象会被认为是同一个调用链
 */
export class ErrorChain {
  chain: WeakMap<Error, ErrorChainItem []>;
  constructor() {
    this.chain = new WeakMap();
  }

  /**
   * 向 e 的错误链中增加一条调用信息
   * 若要记录发生错误时递归调用链,请保证递归调用时将最初 error 对象抛出,不要新生成 error 对象
   * @param e 错误对象
   * @param identifier 发生错误的节点标识符, 用于输出调用链
   */
  add(e: Error, identifier: string): boolean {
    const errorChainItem = new ErrorChainItem(identifier, e);
    if (this.chain.has(e)) {
      this.chain.get(e).push(errorChainItem);
    } else {
      this.chain.set(e, [errorChainItem]);
    }
    return true;
  }

  /**
   * 清除 e 的错误调用链信息
   * @param e 错误对象
   */
  clear(e: Error): boolean {
    return this.chain.delete(e);
  }

   /**
    * 抛出错误调用链
    * @param e 错误对象
    * @param callback 回调函数
    */
  stackOverflowHandle(e: Error, callback?: () => any): never {
    const temp = [];
    const errorChain = this.chain.get(e) || [];
    const len = errorChain.length;
    for (let index = len - 1; 0 <= index; index--) {
      const item = errorChain[index];
      if (!temp.includes(item.identifier)) {
        temp.push(item.identifier);
      } else {
        temp.push(item.identifier);
        break;
      }
    }

    const msg = STACK_OVERFLOW + '. ' + CIRCULAR_DEPENDENCY + ' ' + temp.join(' --> ');
    if (callback) {
      callback();
    }
    e.message = msg;
    // e.stack = '';
    throw e;
  }

   /**
    * 抛出错误调用链
    * @param e 错误对象
    * @param callback 回调函数
    */
  notFoundHandle(e: Error, callback?: () => any): never {
    const errorChain = this.chain.get(e) || [];
    const reverse = errorChain.map(item => item.identifier).reverse();
    const last = reverse.pop();
    const stackMsg = reverse.join(' --> ');
    const errorMsg = last + ' is not valid in ' + stackMsg + ' context';
    if (callback) {
      callback();
    }
    e.message = errorMsg.replace(/\s{2,}/g, ' ');
    throw e;
  }
}
