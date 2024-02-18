import Entity from "modules/entities/Entity"
import EntityField from "modules/entities/EntityField"

/**
 * Represents a source of context. Context can be read or written to.
 *
 * Often used as a remit for some part of a workflow, so AI doesn't a) get confused b) go off the rails and mess setuff up.
 *
 * @ideas
 * The idea of "self" or "scratchpad" where workflow can access contextual data specific to this task.
 */
export class ContextSourceEntity extends Entity {
	/**
	 * Which context provider this source is for. Every context provider has a unique id.
	 */
	@EntityField()
	provider: string

	@EntityField()
	_read: string

	@EntityField()
	_write: string

	/**
	 * glob-style pattern for which context keys this source represents
	 */

	get read(): string[] {
		return this._read ? this._read.split(",") : []
	}

	/**
	 * glob-style pattern for which context keys this source represents
	 */
	get write(): string[] {
		return this._write ? this._write.split(",") : []
	}
}
