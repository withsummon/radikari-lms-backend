import * as fs from 'fs';
import * as path from 'path';
import { streamHybridChat } from '../src/services/AiChat/HybridChatService';
import { ModelMessage } from 'ai';
import { prisma } from '../src/pkg/prisma';
import { ulid } from 'ulid';

interface CSVRow {
  no: string;
  judulArtikel: string;
  sampel3Question: string;
  jawabanAI: string;
  benarSalah: string;
  jawabanSeharusnya: string;
}

interface ProcessedRow extends CSVRow {
  sources: string[];
  sourceVerification: string;
}

class UATTester {
  private csvPath: string;
  private outputPath: string;
  private currentHeadline: string = '';
  private limit: number = Infinity;

  constructor() {
    this.csvPath = path.join(__dirname, '../UAT KMS - Radikari - Article.csv');
    this.outputPath = path.join(__dirname, '../UAT_Result_Article.csv');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const limitIndex = args.indexOf('--limit');
    if (limitIndex !== -1 && args[limitIndex + 1]) {
      this.limit = parseInt(args[limitIndex + 1], 10);
      console.log(`🎯 Limit set to ${this.limit} rows`);
    }
  }

  private parseCSV(content: string): CSVRow[] {
    const lines = content.split('\n').filter(line => line.trim());
    const rows: CSVRow[] = [];
    
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = this.parseCSVLine(line);
      
      if (columns.length >= 6) {
        rows.push({
          no: columns[1]?.trim() || '',
          judulArtikel: columns[2]?.trim() || '',
          sampel3Question: columns[3]?.trim() || '',
          jawabanAI: columns[4]?.trim() || '',
          benarSalah: columns[5]?.trim() || '',
          jawabanSeharusnya: columns[6]?.trim() || ''
        });
      }
    }
    
    return rows;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  private async getOrCreateChatRoom(tenantId: string, userId: string): Promise<string> {
    // Check if we can find an existing room or create one
    // For UAT, let's create a new room to ensure clean state
    const room = await prisma.aiChatRoom.create({
      data: {
        id: ulid(),
        tenantId,
        userId,
        title: 'UAT Test Session ' + new Date().toISOString(),
      }
    });
    return room.id;
  }

  private async processStreamResponse(messages: ModelMessage[], chatRoomId: string, tenantId: string, userId: string): Promise<{
    text: string;
    sources: string[];
  }> {
    try {
      const response = await streamHybridChat({
        messages,
        chatRoomId,
        tenantId,
        userId
      });

      const sources: string[] = [];
      let textParts: string[] = [];

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available for stream');
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;
          
          // Handle different stream formats
          // 1. AI SDK Data format: 0:"text"
          // 2. Custom SSE format: data: {...}
          
          try {
            if (line.startsWith('0:')) {
              // AI SDK format
              const content = JSON.parse(line.substring(2));
              textParts.push(content);
            } else if (line.startsWith('2:')) {
               // AI SDK data format (sources often come here)
               const data = JSON.parse(line.substring(2));
               if (Array.isArray(data)) {
                 data.forEach(item => {
                   if (item && item.headline) {
                     sources.push(item.headline);
                   }
                 });
               }
            } else if (line.startsWith('d:')) {
               // AI SDK data format variant
               const data = JSON.parse(line.substring(2));
               if (data && data.headline) {
                   sources.push(data.headline);
               }
            } else if (line.startsWith('data: ')) {
              // Custom SSE format
              const dataStr = line.substring(6);
              const data = JSON.parse(dataStr);
              
              if (data.type === 'text-delta') {
                // Check for both 'textDelta' (standard AI SDK) and 'delta' (observed in logs)
                const text = data.textDelta || data.delta;
                if (text) textParts.push(text);
              } else if (data.type === 'data-source') {
                sources.push(data.data.headline);
              }
            }
          } catch (parseError) {
            // console.warn('Failed to parse stream chunk:', line, parseError);
          }
        }
      }

      return {
        text: textParts.join(''),
        sources
      };
    } catch (error) {
      console.error('Error processing stream response:', error);
      return {
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        sources: []
      };
    }
  }

  private verifySources(expectedHeadline: string, sources: string[]): string {
    if (!expectedHeadline) {
      return 'No headline to verify';
    }
    
    const found = sources.some(source => 
      source.toLowerCase().includes(expectedHeadline.toLowerCase())
    );
    
    if (found) {
      return '✓ Headline found in sources';
    } else {
      return `⚠ Warning: Expected headline "${expectedHeadline}" not found in sources. Found: [${sources.join(', ')}]`;
    }
  }

  private rowsToCSV(rows: ProcessedRow[]): string {
    const headers = [
      '',
      'No',
      'Judul Artikel',
      'Sampel 3 Question',
      'Jawaban AI',
      'Benar/Salah',
      'Jawaban yang Seharusnya (dari Tim Radikari)',
      'Sources',
      'Source Verification'
    ];

    const csvLines = [headers.join(',')];

    for (const row of rows) {
      const values = [
        '', // Empty first column
        this.escapeCSVField(row.no),
        this.escapeCSVField(row.judulArtikel),
        this.escapeCSVField(row.sampel3Question),
        this.escapeCSVField(row.jawabanAI),
        this.escapeCSVField(row.benarSalah),
        this.escapeCSVField(row.jawabanSeharusnya),
        this.escapeCSVField(row.sources.join('; ')),
        this.escapeCSVField(row.sourceVerification)
      ];
      csvLines.push(values.join(','));
    }

    return csvLines.join('\n');
  }

  private escapeCSVField(field: string): string {
    if (field == null) return '';
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  }

  async run(): Promise<void> {
    console.log('🚀 Starting UAT Test for HybridChatService...');
    
    try {
      // 1. Setup Database Connection & User
      console.log('🔌 Connecting to database...');
      const tenantId = '01KAR8XNR66TD180JD73XY2M21';
      
      // Find a valid user
      const user = await prisma.user.findFirst();
      if (!user) {
        throw new Error('No users found in database. Please seed the database first.');
      }
      console.log(`👤 Using user: ${user.email} (${user.id})`);

      // 2. Read CSV
      console.log('📖 Reading CSV file...');
      const csvContent = fs.readFileSync(this.csvPath, 'utf-8');
      const rows = this.parseCSV(csvContent);
      
      console.log(`📊 Found ${rows.length} rows to process`);

      const processedRows: ProcessedRow[] = [];
      let processedCount = 0;

      // 3. Process Rows
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Track current headline
        if (row.judulArtikel) {
          this.currentHeadline = row.judulArtikel;
        }
        
        // Only process rows with questions
        if (row.sampel3Question) {
          if (processedCount >= this.limit) {
            console.log(`🛑 Limit of ${this.limit} reached. Stopping.`);
            break;
          }

          console.log(`🤖 Processing question ${i + 1}/${rows.length}: ${row.sampel3Question.substring(0, 50)}...`);
          
          // Create a new chat room for this question to isolate context
          const chatRoomId = await this.getOrCreateChatRoom(tenantId, user.id);

          const messages: ModelMessage[] = [
            {
              role: 'user',
              content: row.sampel3Question
            }
          ];

          const response = await this.processStreamResponse(messages, chatRoomId, tenantId, user.id);
          
          const sourceVerification = this.verifySources(this.currentHeadline, response.sources);
          
          const processedRow: ProcessedRow = {
            ...row,
            judulArtikel: row.judulArtikel || this.currentHeadline,
            jawabanAI: response.text,
            sources: response.sources,
            sourceVerification
          };
          
          processedRows.push(processedRow);
          processedCount++;
          
          console.log(`✅ Completed question ${i + 1}`);
          console.log(`   Sources found: ${response.sources.length}`);
          console.log(`   Verification: ${sourceVerification}`);
          
          // Add delay
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          // Add empty rows for structure
          processedRows.push({
            ...row,
            sources: [],
            sourceVerification: 'No question to process'
          });
        }
      }

      // 4. Write Results
      console.log('💾 Writing results to CSV...');
      const outputCSV = this.rowsToCSV(processedRows);
      fs.writeFileSync(this.outputPath, outputCSV, 'utf-8');
      
      console.log(`✅ UAT Test completed successfully!`);
      console.log(`📄 Results saved to: ${this.outputPath}`);
      console.log(`📊 Processed ${processedRows.filter(r => r.jawabanAI).length} questions`);
      
    } catch (error) {
      console.error('❌ Error during UAT Test:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

if (require.main === module) {
  const tester = new UATTester();
  tester.run().catch(error => {
    console.error('UAT Test failed:', error);
    process.exit(1);
  });
}

export { UATTester };
