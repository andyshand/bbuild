import { Entity, IEntityManager } from "modules/entities"
import getChangedFields from "modules/entities/getChangedFields"
import { flatten } from "remeda"
import { scan } from "rxjs/operators"

import { combineLatest, forkJoin, from, map, merge, mergeMap, Observable, startWith } from "rxjs"
import { promiseWithTimeout } from "./promiseWithTimeout"
import { getEntityTypeName } from "modules/entities/getEntityTypeName"

export function observeAllManagers<T extends IEntityManager[], O>(
	managers: T,
	fn: (manager: IEntityManager) => Observable<O>,
) {
	return managers.map((manager) => fn(manager))
}

export async function resolveFromAllmanagers<T extends IEntityManager[], EntityStr extends string>(
	managers: T,
	id: string,
	opts: { initArgs?: any; entityType: EntityStr },
) {
	try {
		const result = await Promise.all(
			managers.map(async (manager) => {
				return promiseWithTimeout(
					1000,
					async () => {
						const entity = await manager.read(opts.entityType, id).catch(async (err) => {
							if (id.startsWith("singleton") && err.message.includes("not found")) {
								// Try create entity, or return null upon creation fail
								const created = await manager
									.create(opts.entityType as any, {
										id,
										initArgs: opts.initArgs,
									})
									.catch((err) => {
										console.error(err)
										return null
									})
								return created
							} else {
								console.error(err)
							}

							// Entity didn't exist, return null
							return null
						})
						return entity
					},
					`getEntity from  ${manager.id}${manager.constructor.name}`,
				).catch((err) => {
					console.error(err)
					return null
				})
			}),
		)
		// console.log(`Resolved entity from ${managers.length} managers`)
		return result
	} catch (e) {
		console.error(e)
		throw e
	}
}
export function queryFromAllManagers<T extends IEntityManager[], EntityStr extends string>(
	managers: T,
	type: EntityStr,
	query: any,
) {
	const queries$ = managers.map((manager) =>
		from(
			manager.find(type, query).catch((err) => {
				console.error(err)
				return []
			}),
		),
	)
	return forkJoin(queries$).pipe(map((results) => flatten(results)))
}

export function watchFromAllManagers<T extends IEntityManager[], EntityStr extends string>(
	managers: T,
	id: string,
	opts: { initArgs?: any; entityType: EntityStr },
) {
	return from(resolveFromAllmanagers(managers, id, opts)).pipe(
		mergeMap((entities) => {
			const observables = entities
				.filter((e) => !!e)
				.map((entity) => {
					return entity.manager.watch(opts.entityType, { id: entity.id }).pipe(
						startWith(entity),
						scan((accumulatedEntity: Entity, changes) => {
							if (changes instanceof Entity) {
								return changes
							}
							const { revisionNumber, ...update } = changes as any
							return accumulatedEntity.applyWatchUpdate(update, revisionNumber)
						}, entity),
						map((updatedEntity: Entity) => {
							const changedFields = getChangedFields(entity, updatedEntity)
							return { entity: updatedEntity, changedFields }
						}),
					)
				})
			return merge(...observables)
		}),
	)
}

export function queryAndWatchFromAllManagers<T extends IEntityManager[], EntityStr extends string>(
	managers: T,
	type: EntityStr,
	query: any,
) {
	return queryFromAllManagers(managers, type, query).pipe(
		mergeMap((entities) => {
			const observables = entities.map((entity) => watchFromAllManagers(managers, entity.id, { entityType: type }))
			return combineLatest(observables)
		}),
	)
}
