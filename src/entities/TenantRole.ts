export interface TenantRoleDTO {
	id: string
	identifier: string
	tenantId: string
	level: number
	name: string
	description: string
}

export const TenantRoleIdentifier = {
	HEAD_OF_OFFICE: "HEAD_OF_OFFICE",
	OPS_MANAGER: "OPS_MANAGER",
	SUPPORT_MANAGER: "SUPPORT_MANAGER",
	SUPERVISOR: "SUPERVISOR",
	SUPPORT_SUPERVISOR: "SUPPORT_SUPERVISOR",
	TEAM_LEADER: "TEAM_LEADER",
	TRAINER: "TRAINER",
	QUALITY_ASSURANCE: "QUALITY_ASSURANCE",
	AGENT: "AGENT",
	CHECKER: "CHECKER",
	MAKER: "MAKER",
}
