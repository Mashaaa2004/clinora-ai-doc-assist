import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = workerUrl;

export type ExtractedPassage = { page: number; section: string; content: string };
export function splitPassages(text: string, page = 1): ExtractedPassage[] {
  const paragraphs = text.trim().split(/\n\s*\n/);
  const chunks: ExtractedPassage[] = [];
  let current = '';
  for (const paragraph of paragraphs) {
    if (current.length + paragraph.length > 2400 && current) { chunks.push({page,section:`Page ${page}`,content:current}); current=''; }
    for (let i=0;i<paragraph.length;i+=2400) {
      const piece=paragraph.slice(i,i+2400);
      if (piece.length===2400) chunks.push({page,section:`Page ${page}`,content:piece});
      else current += (current?'\n\n':'')+piece;
    }
  }
  if (current.trim()) chunks.push({page,section:`Page ${page}`,content:current});
  return chunks;
}
export async function extractProtocol(file: File): Promise<ExtractedPassage[]> {
  if (file.size>20*1024*1024) throw new Error('Fayl 20 MB dan katta.');
  if (!file.name.toLowerCase().endsWith('.pdf')) return splitPassages(await file.text());
  const loadingTask=getDocument({data:new Uint8Array(await file.arrayBuffer())});
  const pdf=await loadingTask.promise;
  const passages: ExtractedPassage[]=[];
  try {
    for(let page=1;page<=pdf.numPages;page++) {
      const text=await (await pdf.getPage(page)).getTextContent();
      const content=text.items.map(item=>'str' in item?item.str:'').join(' ');
      passages.push(...splitPassages(content,page));
    }
  } finally { await loadingTask.destroy(); }
  if (!passages.length) throw new Error('PDF matni o‘qilmadi. Tekshirilgan matn faylini yuklang.');
  return passages;
}