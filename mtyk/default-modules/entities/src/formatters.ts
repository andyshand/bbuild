import Entity from "./Entity";
import { getEntityTypeName } from "./getEntityTypeName";

const w = typeof window !== "undefined" ? (window as any) : {};
export const formatters = [
	...(w.devtoolsFormatters ?? []),
	{
		header: function (obj: any) {
			if (obj instanceof Entity) {
				return ["div", {}, getEntityTypeName(obj) + ":" + obj.id];
			}
			return null;
		},
		hasBody: function (obj: any) {
			if (obj instanceof Entity) {
				return true;
			}
			return false;
		},
		body: function (obj: any, config: any) {
			if (obj instanceof Entity) {
				const elements = Object.entries(obj.getEntityFieldValues()).map(function ([key, value]: [string, any]) {
					var child;
					if (typeof value === "object" && value !== null) {
						child = [
							"object",
							{
								object: value,
								config: {
									key: key,
								},
							},
						];
					} else {
						child = ["span", {}, key + ": " + (value?.toString() ?? String(value))];
					}
					return ["div", { style: "margin: 5px 0;" }, ["span", {}, key + ": "], child];
				});
				return ["div", {}, ...elements];
			}

			return null;
		},
	},
];
