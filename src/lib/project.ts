/** Where a project's at, in order. */
export const STATUSES = ['planned', 'making', 'finished'] as const;
export type Status = (typeof STATUSES)[number];

export function isStatus(value: unknown): value is Status {
	return STATUSES.includes(value as Status);
}

export const STATUS_NAMES: Record<Status, string> = {
	planned: 'Planned',
	making: 'Making',
	finished: 'Finished'
};
