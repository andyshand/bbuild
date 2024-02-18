import Entity from "modules/entities/Entity"
import EntityField from "modules/entities/EntityField"

export class ProjectEntity extends Entity {
	@EntityField({ defaultValue: "" })
	name: string

	@EntityField({ defaultValue: "" })
	path: string
}

export default ProjectEntity
