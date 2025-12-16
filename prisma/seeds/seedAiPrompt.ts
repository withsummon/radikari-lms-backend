import { PrismaClient } from "../../generated/prisma/client"
import { ulid } from "ulid"

export async function seedAiPrompt(prisma: PrismaClient) {
	const count = await prisma.aiPrompt.count()
	if (count == 0) {
		const tenants = await prisma.tenant.findMany()

		for (const tenant of tenants) {
			await prisma.aiPrompt.create({
				data: {
					id: ulid(),
					tenantId: tenant.id,
					prompt: `Anda adalah seorang konsultan manajemen proyek senior. Saya ingin membuat rencana kerja 3 bulan untuk meluncurkan produk aplikasi edukasi keuangan baru.
Respons Anda harus mencakup:
Tahap 1: Persiapan (Bulan 1): Fokus pada riset pasar dan desain dasar.
Tahap 2: Pengembangan (Bulan 2): Fokus pada coding inti (MVP/Minimum Viable Product).
Tahap 3: Peluncuran (Bulan 3): Fokus pada pengujian beta, pemasaran awal, dan launching.
Format: Sajikan rencana ini dalam bentuk tabel markdown dengan empat kolom: Tahap, Minggu, Aktivitas Utama, dan Indikator Keberhasilan (KPI).
Gaya Bahasa: Gunakan bahasa Indonesia formal dan profesional, dan cetak tebal istilah-istilah kunci dalam manajemen proyek.`,
				},
			})
		}
	}
}
