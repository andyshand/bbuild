import { EntityField } from "modules/entities"

type SelectionItem = { type: string; id: string }

export class SelectionEntity {
	@EntityField({ defaultValue: [] })
	selection: SelectionItem[]

	deselectAll() {
		this.selection = []
	}

	toggleSelection(item: SelectionItem) {
		const index = this.selection.findIndex(
			(selectedItem) => selectedItem.type === item.type && selectedItem.id === item.id,
		)
		if (index === -1) {
			this.addToSelection(item)
		} else {
			this.removeFromSelection(item)
		}
	}

	addToSelection(item: SelectionItem) {
		const index = this.selection.findIndex(
			(selectedItem) => selectedItem.type === item.type && selectedItem.id === item.id,
		)
		if (index === -1) {
			this.selection.push(item)
		}
	}

	removeFromSelection(item: SelectionItem) {
		const index = this.selection.findIndex(
			(selectedItem) => selectedItem.type === item.type && selectedItem.id === item.id,
		)
		if (index !== -1) {
			this.selection.splice(index, 1)
		}
	}
}
