import { EntityTypable } from "./EntityTypable";

export function entityType(classOrString: EntityTypable) {
	function getEntityTypeName(classOrString: EntityTypable) {
		if (typeof classOrString === "string") {
			return classOrString;
		} else {
			// For proxied objects
			if (classOrString.constructor.name !== "Function") {
				return (classOrString as any).constructor.name;
			}

			if ("prototype" in classOrString) {
				return classOrString.prototype.constructor.name;
			} else if ("name" in classOrString) {
				return (classOrString as any).name;
			} else {
				throw new Error("Invalid entity type");
			}
		}
	}

	return getEntityTypeName(classOrString).replace("bound ", "").trim();
}
