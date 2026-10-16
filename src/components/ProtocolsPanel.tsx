import { useEffect, useState } from 'react';
import { Search, Upload, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { extractProtocol } from '@/lib/protocol-documents';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

const initial={title:'',specialty:'',disease:'',keywords:'',issuing_authority:'',revision_date:'',version:'',source_url:'',document_kind:'clinical'};
export default function ProtocolsPanel(){
  const [rows,setRows]=useState<Tables<'clinical_protocols'>[]>([]);
  const [form,setForm]=useState(initial);
  const [file,setFile]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [query,setQuery]=useState('');
  const [passages,setPassages]=useState<Tables<'protocol_passages'>[]>([]);
  const [selected,setSelected]=useState<string|null>(null);
  const [question,setQuestion]=useState('');
  const [matches,setMatches]=useState<Awaited<ReturnType<typeof search>>>([]);
  async function load(){const {data,error}=await supabase.from('clinical_protocols').select('*').order('created_at',{ascending:false});if(error)toast.error(error.message);else setRows(data??[]);}
  useEffect(()=>{void load();},[]);
  async function search(){const {data,error}=await supabase.rpc('search_protocol_passages',{search_text:question.split(/\s+/).filter(Boolean).map(w=>`"${w.replace(/"/g,'')}"`).join(' OR ')});if(error)throw error;return data??[];}
  async function upload(e:React.FormEvent){e.preventDefault();if(!file)return;setBusy(true);let path:string|null=null;let id:string|null=null;try{
    const extracted=await extractProtocol(file);
    if(!extracted.length)throw new Error('Hujjat matni bo‘sh.');
    path=`${crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
    const {error:storageError}=await supabase.storage.from('clinical-protocols').upload(path,file);if(storageError)throw storageError;
    const {data,error}=await supabase.from('clinical_protocols').insert({...form,revision_date:form.revision_date||null,file_path:path,status:'pending'}).select('id').single();if(error)throw error;id=data.id;
    for(let i=0;i<extracted.length;i+=100){const {error:chunkError}=await supabase.from('protocol_passages').insert(extracted.slice(i,i+100).map(c=>({...c,protocol_id:data.id})));if(chunkError)throw chunkError;}
    toast.success('Hujjat yuklandi. Manba va matnni tekshirib tasdiqlang.');setForm(initial);setFile(null);await load();
  }catch(e){if(id)await supabase.from('clinical_protocols').delete().eq('id',id);if(path)await supabase.storage.from('clinical-protocols').remove([path]);toast.error(e instanceof Error?e.message:'Yuklashda xatolik');}finally{setBusy(false);}}
  async function open(id:string){setSelected(id);const {data,error}=await supabase.from('protocol_passages').select('*').eq('protocol_id',id).order('page');if(error)toast.error(error.message);else setPassages(data??[]);}
  async function status(id:string,status:string){if(status==='verified'&&!window.confirm('Rasmiy manba, hujjat matni va amaldagi versiyasini tekshirdingizmi?'))return;const {error}=await supabase.from('clinical_protocols').update({status}).eq('id',id);if(error)toast.error(error.message);else{toast.success('Holat saqlandi');await load();}}
  const visible=rows.filter(p=>[p.title,p.specialty,p.disease,p.keywords].join(' ').toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-8">
    <div><h1 className="text-xl font-semibold">Klinik protokollar</h1><div className="mt-2 flex flex-wrap gap-4 text-sm text-primary"><a href="https://gov.uz/uz/ssv/pages/milliy-klinik-protokollar" target="_blank" rel="noreferrer">Milliy klinik protokollar ↗</a><a href="https://gov.uz/oz/ssv/pages/metodologiya" target="_blank" rel="noreferrer">Metodologiya ↗</a></div></div>
    <form onSubmit={upload} className="space-y-4 border-y border-border py-5"><h2 className="font-semibold">Rasmiy hujjat yuklash</h2><div className="grid gap-4 sm:grid-cols-2">{(Object.keys(initial).filter(k=>k!=='document_kind') as (keyof typeof initial)[]).map(k=><div key={k}><Label htmlFor={`protocol-${k}`}>{({title:'Rasmiy nomi',specialty:'Mutaxassislik',disease:'Kasallik',keywords:'Kalit so‘zlar',issuing_authority:'Tasdiqlagan tashkilot',revision_date:'Tasdiq / qayta ko‘rish sanasi',version:'Versiya',source_url:'Rasmiy HTTPS manba',document_kind:'Hujjat turi'})[k]}</Label><Input id={`protocol-${k}`} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} type={k==='revision_date'?'date':k==='source_url'?'url':'text'} required={['title','issuing_authority','source_url'].includes(k)} pattern={k==='source_url'?'https://.*':undefined} maxLength={1000}/></div>)}</div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label>Hujjat turi</Label><Select value={form.document_kind} onValueChange={v=>setForm({...form,document_kind:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="clinical">Klinik protokol</SelectItem><SelectItem value="methodology">Metodologiya (davolash uchun emas)</SelectItem></SelectContent></Select></div><div><Label htmlFor="protocol-file">PDF / TXT</Label><Input id="protocol-file" type="file" accept=".pdf,.txt,.md" required onChange={e=>setFile(e.target.files?.[0]??null)}/></div></div>
      <Button disabled={busy||!file} type="submit">{busy?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Upload className="mr-2 h-4 w-4"/>}Yuklash</Button>
    </form>
    <div className="space-y-4"><div className="flex items-center gap-2"><Search className="h-4 w-4"/><Input aria-label="Protokollarni qidirish" placeholder="Nom, mutaxassislik, kasallik..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
      {!visible.length&&<p className="py-4 text-muted-foreground">Protokollar topilmadi.</p>}
      {visible.map(p=><article key={p.id} className="border-b border-border py-4"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><h3 className="break-words font-semibold">{p.title}</h3><p className="text-sm text-muted-foreground">{p.specialty} · {p.version||'—'} · {p.revision_date||'—'}</p><a href={p.source_url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">{p.issuing_authority}</a></div><Select value={p.status} onValueChange={v=>void status(p.id,v)}><SelectTrigger className="w-48"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="pending">Tekshiruv kutilmoqda</SelectItem><SelectItem value="verified">Tasdiqlangan</SelectItem><SelectItem value="outdated">Eskirgan</SelectItem></SelectContent></Select><Button variant="outline" onClick={()=>void open(p.id)}><FileText className="mr-2 h-4 w-4"/>Matnni ko‘rish</Button></div>{selected===p.id&&<div className="mt-4 max-h-96 space-y-3 overflow-y-auto">{passages.map(c=><blockquote key={c.id} className="border-l-2 border-primary pl-3 text-sm"><b>{c.page}-sahifa · {c.section}</b><p className="whitespace-pre-wrap">{c.content}</p></blockquote>)}</div>}</article>)}
    </div>
    <form className="space-y-3 border-t border-border pt-5" onSubmit={async e=>{e.preventDefault();try{setMatches(await search());}catch(e){toast.error(e instanceof Error?e.message:'Qidiruvda xatolik');}}}><h2 className="font-semibold">Tasdiqlangan manbadan parcha qidirish</h2><div className="flex gap-2"><Input aria-label="Protokol savoli" value={question} onChange={e=>setQuestion(e.target.value)} required/><Button type="submit" variant="outline" aria-label="Parcha qidirish"><Search className="h-4 w-4"/></Button></div>{matches.map(p=><blockquote key={p.passage_id} className="border-l-2 border-primary pl-3 text-sm"><b>{p.title} · {p.page}-sahifa</b><p>{p.content}</p></blockquote>)}</form>
  </div>;
}