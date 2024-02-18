import Entity from './Entity';

/**
 * @todo at some point it will be necessary to track the _latest_ changes to each entity
 * since some entities may be updated multiple times before being saved.
 */
async function saveDirtyEntities(entities: Entity[]): Promise<void> {
  // const uniqueEntitiesMap = new Map<string, Entity[]>();

  // // Group entities with the same ID
  // for (const entity of entities) {
  //   if (entity.isDirty) {
  //     const entityId = entity.id;
  //     const group = uniqueEntitiesMap.get(entityId) || [];
  //     group.push(entity);
  //     uniqueEntitiesMap.set(entityId, group);
  //   }
  // }

  // const mergeUpdates = (entities: Entity[]) => {
  //   if (!entities || entities.length === 0) return {};

  //   const updates = {};

  //   // Merge updates from all dirty entities with the same ID
  //   for (const entity of entities) {
  //     Object.assign(updates, entity.getModifiedFieldValues());
  //     entity.markClean(); // Mark the entity clean after saving
  //   }

  //   return updates;
  // };

  // // Save merged updates for each unique entity
  // for (const [entityId, entityGroup] of uniqueEntitiesMap.entries()) {
  //   const entityType = getEntityTypeName(entityGroup[0]);
  //   const entityManager = entityGroup[0].manager;
  //   const updates = mergeUpdates(entityGroup);

  //   await entityManager.update(entityType, entityId, updates, entityGroup[0].revisionNumber);
  // }
}

export default saveDirtyEntities;