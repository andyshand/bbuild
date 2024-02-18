import { IEntityManager } from './IEntityManager';

export interface EntityConfig {
  /**
   * Which manager was this entity created by?
   */
  manager?: IEntityManager;
}
