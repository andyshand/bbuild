export default function useSelection(id: string) {
	return {
		selectAll: () => {},
		deselectAll: () => {},
		select: (item: any) => {},
		deselect: (item: any) => {},
	}
}
