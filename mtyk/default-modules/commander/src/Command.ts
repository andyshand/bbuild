import { Entity, EntityField } from "modules/entities";

export class Command extends Entity {
  @EntityField()
  title: string;

  @EntityField()
  icon: string;

  @EntityField()
  query: string;
}
