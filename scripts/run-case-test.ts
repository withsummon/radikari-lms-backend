import * as fs from "fs"
import * as path from "path"
import { parse } from "csv-parse/sync"
import { stringify } from "csv-stringify/sync"
import { streamHybridChat } from "../src/services/AiChat/HybridChatService"
import { ModelMessage } from "ai"
import { prisma } from "../src/pkg/prisma"
import { ulid } from "ulid"

interface CaseCSVRow {
	no: string
	judulCase: string
	sampel3Question: string
	jawabanAI: string
	benarSalah: string
	jawabanSeharusnya: string
}

interface ProcessedCaseRow extends CaseCSVRow {
	sources: string[]
}

class UATCaseTester {
	private csvPath: string
	private outputPath: string
	private currentCaseTitle: string = ""
	private limit: number = Infinity

	constructor() {
		this.csvPath = path.join(__dirname, "../UAT KMS - Radikari - Case.csv")
		this.outputPath = path.join(__dirname, "../UAT_Result_Case.csv")

		// Parse command line arguments
		const args = process.argv.slice(2)
		const limitIndex = args.indexOf("--limit")
		if (limitIndex !== -1 && args[limitIndex + 1]) {
			this.limit = parseInt(args[limitIndex + 1], 10)
			console.log(`🎯 Limit set to ${this.limit} rows`)
		}
	}

	private async getOrCreateChatRoom(
		tenantId: string,
		userId: string,
	): Promise<string> {
		const room = await prisma.aiChatRoom.create({
			data: {
				id: ulid(),
				tenantId,
				userId,
				title: "UAT Case Test Session " + new Date().toISOString(),
			},
		})
		return room.id
	}

	private async processStreamResponse(
		messages: ModelMessage[],
		chatRoomId: string,
		tenantId: string,
		userId: string,
	): Promise<{
		text: string
		sources: string[]
	}> {
		try {
			const response = await streamHybridChat({
				messages,
				chatRoomId,
				tenantId,
				userId,
			})

			const sources: string[] = []
			let textParts: string[] = []

			const reader = response.body?.getReader()
			if (!reader) {
				throw new Error("No reader available for stream")
			}

			const decoder = new TextDecoder()

			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				const chunk = decoder.decode(value, { stream: true })
				const lines = chunk.split("\n")

				for (const line of lines) {
					if (!line.trim()) continue

					try {
						if (line.startsWith("0:")) {
							// AI SDK format
							const content = JSON.parse(line.substring(2))
							textParts.push(content)
						} else if (line.startsWith("2:")) {
							// AI SDK data format (sources often come here)
							const data = JSON.parse(line.substring(2))
							if (Array.isArray(data)) {
								data.forEach((item) => {
									if (item && item.headline) {
										sources.push(item.headline)
									}
								})
							}
						} else if (line.startsWith("d:")) {
							// AI SDK data format variant
							const data = JSON.parse(line.substring(2))
							if (data && data.headline) {
								sources.push(data.headline)
							}
						} else if (line.startsWith("data: ")) {
							// Custom SSE format
							const dataStr = line.substring(6)
							const data = JSON.parse(dataStr)

							if (data.type === "text-delta") {
								const text = data.textDelta || data.delta
								if (text) textParts.push(text)
							} else if (data.type === "data-source") {
								sources.push(data.data.headline)
							}
						}
					} catch (parseError) {
						// console.warn('Failed to parse stream chunk:', line, parseError);
					}
				}
			}

			return {
				text: textParts.join(""),
				sources,
			}
		} catch (error) {
			console.error("Error processing stream response:", error)
			return {
				text: `Error: ${error instanceof Error ? error.message : String(error)}`,
				sources: [],
			}
		}
	}

	async run(): Promise<void> {
		console.log("🚀 Starting UAT Case Test for HybridChatService...")

		try {
			// 1. Setup Database Connection & User
			console.log("🔌 Connecting to database...")
			const tenantId = "01KAR8XNR66TD180JD73XY2M21"

			const user = await prisma.user.findFirst()
			if (!user) {
				throw new Error(
					"No users found in database. Please seed the database first.",
				)
			}
			console.log(`👤 Using user: ${user.email} (${user.id})`)

			// 2. Read CSV
			console.log("📖 Reading CSV file...")
			const csvContent = fs.readFileSync(this.csvPath, "utf-8")

			// Use csv-parse to handle the CSV structure robustly
			const records = parse(csvContent, {
				columns: false, // We'll map manually based on index to be safe
				skip_empty_lines: true,
				from_line: 2, // Skip header row
			})

			console.log(`📊 Found ${records.length} rows to process`)

			const processedRows: ProcessedCaseRow[] = []
			let processedCount = 0

			// 3. Process Rows
			for (let i = 0; i < records.length; i++) {
				const record = records[i]

				// Map columns based on the file structure:
				// No, Judul Case, Sampel 3 Question, Jawaban AI, Benar/Salah, Jawaban yang Seharusnya
				const no = record[0]
				const judulCase = record[1]
				const question = record[2]
				const benarSalah = record[4]
				const jawabanSeharusnya = record[5]

				// Track current case title (fill-down logic)
				if (judulCase && judulCase.trim()) {
					this.currentCaseTitle = judulCase.trim()
				}

				// Only process rows with questions
				if (question && question.trim()) {
					if (processedCount >= this.limit) {
						console.log(`🛑 Limit of ${this.limit} reached. Stopping.`)
						break
					}

					console.log(
						`🤖 Processing question ${i + 1}/${records.length}: ${question.substring(0, 50)}...`,
					)

					const chatRoomId = await this.getOrCreateChatRoom(tenantId, user.id)

					const messages: ModelMessage[] = [
						{
							role: "user",
							content: question,
						},
					]

					const response = await this.processStreamResponse(
						messages,
						chatRoomId,
						tenantId,
						user.id,
					)

					const processedRow: ProcessedCaseRow = {
						no,
						judulCase: judulCase || this.currentCaseTitle,
						sampel3Question: question,
						jawabanAI: response.text,
						benarSalah,
						jawabanSeharusnya,
						sources: response.sources,
					}

					processedRows.push(processedRow)
					processedCount++

					console.log(`✅ Completed question ${i + 1}`)
					console.log(`   Sources found: ${response.sources.length}`)

					// Add delay to avoid rate limits
					await new Promise((resolve) => setTimeout(resolve, 1000))
				} else {
					// Preserve structure for rows without questions (if any)
					processedRows.push({
						no,
						judulCase: judulCase || this.currentCaseTitle,
						sampel3Question: question,
						jawabanAI: "",
						benarSalah,
						jawabanSeharusnya,
						sources: [],
					})
				}
			}

			// 4. Write Results
			console.log("💾 Writing results to CSV...")

			// Prepare data for csv-stringify
			const outputData = [
				[
					"No",
					"Judul Case",
					"Sampel 3 Question",
					"Jawaban AI",
					"Benar/Salah",
					"Jawaban yang Seharusnya",
					"Sources",
				],
			]

			processedRows.forEach((row) => {
				outputData.push([
					row.no,
					row.judulCase,
					row.sampel3Question,
					row.jawabanAI,
					row.benarSalah,
					row.jawabanSeharusnya,
					row.sources.join("; "),
				])
			})

			const outputCSV = stringify(outputData)
			fs.writeFileSync(this.outputPath, outputCSV, "utf-8")

			console.log(`✅ UAT Case Test completed successfully!`)
			console.log(`📄 Results saved to: ${this.outputPath}`)
			console.log(
				`📊 Processed ${processedRows.filter((r) => r.jawabanAI).length} questions`,
			)
		} catch (error) {
			console.error("❌ Error during UAT Case Test:", error)
			throw error
		} finally {
			await prisma.$disconnect()
		}
	}
}

if (require.main === module) {
	const tester = new UATCaseTester()
	tester.run().catch((error) => {
		console.error("UAT Case Test failed:", error)
		process.exit(1)
	})
}

export { UATCaseTester }
