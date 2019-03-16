import { Container, provide, inject, ObjectConfiguration } from './src';

const config = new ObjectConfiguration();
config.set('aa', 22);
config.set('bb', 33);

@provide()
export class Base {
  // @inject()
  // basec;
  // constructor(@inject() baseB) {
  //   baseB();
  //   }
}

@provide('baseA')
export class BaseA {
  @inject()
  base;
  @inject()
  baseB;
}

@provide()
export class BaseB {
  @inject()
  base;
  @inject()
  baseC;
}

@provide()
export class BaseC {
  @inject()
  base;
  @inject()
  baseA;
}
export class BaseD {
  @inject()
  base;
  @inject()
  baseA;
}

const container = new Container();
container.bind(Base);
container.bind(BaseA);
container.bind(BaseB);
container.bind(BaseC);
container.get('baseA');
console.log(container.dumpDependency());
