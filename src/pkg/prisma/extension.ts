import { ulid } from "ulid"

export const ulidExtension = {
	query: {
		$allModels: {
			async create({ args, query }: { args: any; query: any }) {
				if (args.data && !args.data.id) {
					args.data.id = ulid()
				}
				return query(args)
			},
			async createMany({ args, query }: { args: any; query: any }) {
				if (Array.isArray(args.data)) {
					args.data = args.data.map((item: any) => ({
						...item,
						id: item.id || ulid(),
					}))
				} else if (args.data && !args.data.id) {
					args.data.id = ulid()
				}
				return query(args)
			},
			async upsert({ args, query }: { args: any; query: any }) {
				if (args.create && !args.create.id) {
					args.create.id = ulid()
				}
				return query(args)
			},
		},
	},
}
