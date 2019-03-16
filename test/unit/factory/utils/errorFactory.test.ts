import {
  isNotFoundExeption,
  NotFoundError,
  isStackOverflowExeption,
  ErrorChain
} from "../../../../src/utils/errorFactory";
import { expect } from "chai";
// import { STACK_OVERFLOW } from "../../../../src/utils/errMsg";

describe("/test/unit/utils/errorFactory.test.ts", () => {
  it("Should be throw NotFoundError", () => {
    const creatNormalError = function(msg) {
      throw new Error(msg);
    };
    const creatNotFoundError = function(msg) {
      throw new NotFoundError(msg);
    };

    try {
      creatNormalError("");
    } catch (error) {
      expect(error).to.instanceOf(Error);
      expect(isNotFoundExeption(error)).to.false;
    }

    try {
      creatNotFoundError("testKey");
    } catch (error) {
      expect(error).to.instanceOf(Error);
      expect(isNotFoundExeption(error)).to.true;
      expect(() => {
        throw error;
      }).to.throw("testKey");
    }
  });

  it("Should be StackOverflowExeption", () => {
    function a() {
      b();
    }
    function b() {
      a();
    }
    try {
      a();
    } catch (error) {
      expect(isStackOverflowExeption(error)).to.true;
    }
  });

  it("Should be throw stackOverflow", () => {
    const errorChain = new ErrorChain();
    const e = new Error('stackOverflow');
    [
      [e, "test1"],
      [e, "test2"],
      [e, "test1"],
      [e, "test2"],
      [e, "test3"]
    ].forEach((item: [Error, string]) => errorChain.add(...item));
    expect(errorChain.chain.get(e)).to.have.lengthOf(5);
    try {
      errorChain.stackOverflowHandle(e);
    } catch (error) {
      errorChain.clear(e);
      expect(errorChain.chain.get(e)).to.equal(undefined);
      expect(() => {
        throw error;
      }).to.throw(Error, 'Maximum call stack size exceeded. Circular dependency found: test3 --> test2 --> test1 --> test2' );
    }
  });

  it("Should be throw notFoundHandle", () => {
    const errorChain = new ErrorChain();
    const e = new Error('not found');
    [
      [e, "test1"],
      [e, "test2"],
      [e, "test3"]
    ].forEach((item: [Error, string]) => errorChain.add(...item))
    expect(errorChain.chain.get(e)).to.have.lengthOf(3);
    try {
      errorChain.notFoundHandle(e);
    } catch (error) {
      errorChain.clear(e);
      expect(errorChain.chain.get(e)).to.equal(undefined);
      expect(() => {
        throw error;
      }).to.throw(Error, 'test1 is not valid in test3 --> test2 context');
    }
  });

  it("Should be throw Error with more then 2 error instace", () => {
    const errorChain = new ErrorChain();
    const e1 = new Error('stackOverflow');
    const e2 = new Error('not found');
    [
      [e1, "test1",],
      [e1, "test2",],
      [e1, "test1",],
      [e1, "test2",],
      [e1, "test3",],
      [e2, "test11",],
      [e2, "test22",],
      [e2, "test33",],
    ].forEach((item: [Error, string]) => errorChain.add(...item));

    expect(errorChain.chain.get(e1)).to.have.lengthOf(5);
    expect(errorChain.chain.get(e2)).to.have.lengthOf(3);
    try {
      errorChain.stackOverflowHandle(e1, () => errorChain.clear(e1));
    } catch (error) {
      expect(errorChain.chain.get(e1)).to.equal(undefined);
      expect(() => {
        throw error;
      }).to.throw(Error, 'Maximum call stack size exceeded. Circular dependency found: test3 --> test2 --> test1 --> test2');
    }

    expect(errorChain.chain.get(e2)).to.have.lengthOf(3);
    try {
      errorChain.notFoundHandle(e2, () => errorChain.clear(e2));
    } catch (error) {
      expect(errorChain.chain.get(e2)).to.equal(undefined);
      expect(() => {
        throw error;
      }).to.throw(Error, 'test11 is not valid in test33 --> test22 context');
    }
  });

});
