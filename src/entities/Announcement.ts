export interface AnnouncementDTO {
	id: string
	title: string
	content: string
	tenantId: string
	createdByUserId: string
}

export interface AnnouncementCreateDTO extends AnnouncementDTO {
	tenantRoleIds: string[]
}
