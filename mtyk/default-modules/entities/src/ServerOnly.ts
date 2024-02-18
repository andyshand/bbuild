import 'reflect-metadata';

export function EntityRelation<T>(innerType: T) {
  return function (target: any, propertyKey: string) {
    // const type = Reflect.getMetadata('design:type', target, propertyKey);
    // console.log('entity relation', innerType)
    // console.log(`Property type of ${propertyKey}: ${type.name}`);

    Reflect.defineMetadata('serverOnly', innerType, target, propertyKey)
    // if (type === Array) {
    // const paramTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey);
    // console.log(paramTypes);
    // console.log(`Array inner type: ${paramTypes[0].name}`);
    // }
  };
}

export default EntityRelation