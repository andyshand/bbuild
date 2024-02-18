import 'reflect-metadata'

const serializableMetadataKey = Symbol('serializable');

export type SerializableOptions = {
  onSave?: (value: any) => any;
  onLoad?: (value: any) => any;
};

export function Serialisable(options: SerializableOptions = {}): PropertyDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(serializableMetadataKey, options, target, propertyKey);
  };
}

export { serializableMetadataKey };

