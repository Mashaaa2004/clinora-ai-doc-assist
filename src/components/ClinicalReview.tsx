import { Textarea } from '@/components/ui/textarea';
export type ClinicalFields = {
  soap?: {subjective:string;objective:string;assessment:string;plan:string};
  review_flags?:string[]; urgent_flags?:string[]; protocol_status?:string;
  protocol_refs?: {passage_id:string;title:string;source_url:string;version:string;revision_date:string|null;page:number;section:string;content:string}[];
  draft_id?:string;
};
export default function ClinicalReview({value,onChange,approved}:{value:ClinicalFields;onChange:(key:'subjective'|'objective'|'assessment'|'plan',text:string)=>void;approved:boolean}) {
  return <section className="my-5 space-y-4 border-y border-border py-5">
    <h2 className="font-semibold text-primary">{approved?'Shifokor tasdiqlagan hujjat':'AI qoralamasi — shifokor ko‘rigi kutilmoqda'}</h2>
    <div className="grid gap-4 md:grid-cols-2">{(['subjective','objective','assessment','plan'] as const).map((key,i)=><label className="space-y-2 text-sm" key={key}><span className="font-medium">{['S — Shikoyatlar','O — Ko‘rik va natijalar','A — Shifokor bahosi','P — Reja'][i]}</span><Textarea aria-label={key} value={value.soap?.[key]??''} onChange={e=>onChange(key,e.target.value)} disabled={approved} className="min-h-24"/></label>)}</div>
    {(value.urgent_flags??[]).length>0&&<div className="border-l-4 border-destructive pl-3 text-destructive"><h3 className="font-semibold">Shoshilinch ko‘rik talab qiladigan belgilar</h3><ul className="list-inside list-disc">{value.urgent_flags?.map((f,i)=><li key={i}>{f}</li>)}</ul></div>}
    {(value.review_flags??[]).length>0&&<div className="border-l-4 border-warning pl-3"><h3 className="font-semibold">Aniqlashtirish kerak</h3><ul className="list-inside list-disc text-sm">{value.review_flags?.map((f,i)=><li key={i}>{f}</li>)}</ul></div>}
    <h3 className="font-medium">Rasmiy protokol manbalari</h3>
    {!value.protocol_refs?.length?<p className="text-sm text-muted-foreground">Tasdiqlangan mos protokol topilmadi.</p>:value.protocol_refs.map(p=><details key={p.passage_id} className="border-b border-border pb-3 text-sm"><summary className="cursor-pointer font-medium">{p.title} · {p.section} · {p.page}-sahifa</summary><p className="my-2 text-muted-foreground">{p.version||'Versiya ko‘rsatilmagan'} · {p.revision_date||'Sana ko‘rsatilmagan'}</p><blockquote className="whitespace-pre-wrap border-l-2 border-primary pl-3">{p.content}</blockquote><a className="mt-2 inline-block text-primary underline" href={p.source_url} target="_blank" rel="noreferrer">Rasmiy manba</a></details>)}
  </section>;
}