import 'reflect-metadata';

export function EntityFunction() {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata('entityFunction', true, target, propertyKey);
    
  };
}

export default EntityFunction