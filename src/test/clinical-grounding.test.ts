import { describe, it, expect } from 'vitest';
import { attachGrounding, minimizeIdentifiers, retrievalQuery, type Passage } from '../../supabase/functions/_shared/clinical-grounding';
const passage:Passage={passage_id:'verified-1',protocol_id:'p1',title:'Synthetic source',specialty:'test',source_url:'https://example.org/synthetic',version:'1',revision_date:null,page:3,section:'Test',content:'synthetic evidence'};
describe('Clinical grounding rules',()=>{
  it('does not accept fabricated citation IDs',()=>{expect(attachGrounding({cited_passage_ids:['fabricated']},[passage]).protocol_refs).toEqual([]);});
  it('preserves exact retrieved page and passage on accepted citations',()=>{expect(attachGrounding({cited_passage_ids:['verified-1']},[passage]).protocol_refs).toEqual([passage]);});
  it('explicitly marks absent verified protocols',()=>{expect(attachGrounding({},[]).protocol_status).toBe('no_verified_protocol');});
  it('does not finalize generated output',()=>{expect(attachGrounding({document_status:'approved'},[]).document_status).toBe('draft');});
  it('removes explicitly known patient names',()=>{expect(minimizeIdentifiers('Synthetic Person reports pain',['Synthetic Person'])).toBe('[identity removed] reports pain');});
  it('removes contact details from nested CRM records',()=>{expect(minimizeIdentifiers({patient_name:'Synthetic Person',notes:'Call test@example.org',phone:'+998901234567'})).toEqual({notes:'Call [email removed]'});});
  it('creates OR retrieval so verbose notes do not require every token',()=>{expect(retrievalQuery('diabetes hypertension diabetes')).toBe('"diabetes" OR "hypertension"');});
});