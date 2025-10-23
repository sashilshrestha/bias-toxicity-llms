import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "..", "..", "..", "data", "processed", "toxicity_summary.json");
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    return new Response(JSON.stringify(jsonData), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error reading file:', error);
    return new Response(JSON.stringify({ error: 'File not found' }), {
      status: 500,
    });
  }
}
