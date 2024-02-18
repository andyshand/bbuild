import { Observable, Subject } from "rxjs";
import { EntityTypable } from "../EntityTypable";
import MongoEntityManager from "../MongoEntityManager";
import { getEntityTypeName } from "../getEntityTypeName";

interface EntityData {
  timer: any;
  updatedFields: any;
  lastUpdated: any;
  subject: Subject<any>;
}

export class ChangeStreamBatcher {
  private changeStreams: Map<string, any> = new Map();
  private entityDataMap: Map<string, EntityData> = new Map();

  constructor(private readonly mongoEntityManager: MongoEntityManager) {}

  getMongoDBChangeStream(type: EntityTypable, options: { id: string }) {
    const entityType = getEntityTypeName(type);

    // disable change stream to use notifyUpdate instead
    // if (!this.changeStreams.has(entityType)) {
    //   this.initializeChangeStream(entityType)
    // }

    const entityQueueKey = `${entityType}-${options.id}`;

    if (!this.entityDataMap.has(entityQueueKey)) {
      this.entityDataMap.set(entityQueueKey, {
        timer: null,
        updatedFields: {},
        subject: new Subject<any>(),
        lastUpdated: new Date(0),
      });
    }

    const entityData = this.entityDataMap.get(entityQueueKey)!;

    return new Observable((observer) => {
      const subscription = entityData.subject.subscribe(observer);
      return () => {
        subscription.unsubscribe();
        if (entityData.subject.observers?.length ?? 0 === 0) {
          this.entityDataMap.delete(entityQueueKey);
          if (
            this.changeStreams.get(entityType)?.observers?.length ??
            0 === 0
          ) {
            this.changeStreams.get(entityType)?.close();
            this.changeStreams.delete(entityType);
          }
        }
      };
    });
  }

  notifyUpdate(entityType: EntityTypable, id: string, updates: any) {
    const entityQueueKey = `${getEntityTypeName(entityType)}-${id}`;
    const entityData = this.entityDataMap.get(entityQueueKey);

    if (entityData) {
      entityData.subject.next(updates);
    }
  }

  private initializeChangeStream(entityType: string) {
    const collection = this.mongoEntityManager.getCollection(entityType);
    const changeStream = collection.watch();
    this.changeStreams.set(entityType, changeStream);

    changeStream.on("change", async (change: any) => {
      if ("documentKey" in change) {
        const id = change.documentKey?._id.toString();
        const entityQueueKey = `${entityType}-${id}`;
        const entityData = this.entityDataMap.get(entityQueueKey);

        if (entityData) {
          try {
            if ("updateDescription" in change) {
              const updatedFields =
                change.updateDescription.updatedFields || {};
              const removedFields =
                change.updateDescription.removedFields || [];

              for (const field of removedFields) {
                delete updatedFields[field];
              }

              Object.assign(entityData.updatedFields, updatedFields);
            }

            // const lastUpdated = Date.now() - entityData.lastUpdated
            const process = () => {
              entityData.subject.next(entityData.updatedFields);
              entityData.updatedFields = {};
              entityData.timer = null;
            };
            //
            // process() // test Disabled battcher
            //
            // if (lastUpdated > 1000) {
            //   process()
            // } else if (!entityData.timer) {
            //   entityData.timer = setTimeout(process, 500)
            // }

            entityData.lastUpdated = new Date().getTime();
          } catch (e) {
            console.error(e);
            try {
              entityData.subject.next(
                await this.mongoEntityManager.read(entityType, id)
              );
            } catch (error) {
              console.error(error);
            }
          }
        }
      }
    });

    changeStream.on("error", (error) => {
      console.error(`changeStream error: ${JSON.stringify(error)}`);
    });

    changeStream.on("end", () => {
      console.debug(`changeStream end`);
    });
  }
}
