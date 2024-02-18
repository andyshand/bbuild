import { Entity, EntityField } from 'modules/entities';

export class Tool extends Entity {
  @EntityField()
  fromChat?: string;

  @EntityField()
  category?: string
  
  @EntityField()
  name: string;

  @EntityField()
  code: string
}
