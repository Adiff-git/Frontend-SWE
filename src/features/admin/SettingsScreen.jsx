import { useRef, useState } from 'react';
import Button from '../../components/Button';
import FormField from '../../components/FormField';
import { useAdmin } from './adminContext';
import { Alert, Empty, PageHeading, Panel } from './shared';
import useDraftNavigation, { readDraft } from './useDraftNavigation';

export default function SettingsScreen(){
  const {catalog,mutate,scenario}=useAdmin();
  const [draft,setDraft]=useState(()=>structuredClone(readDraft('settings')||catalog.settings));
  const [tab,setTab]=useState('banners');const [error,setError]=useState('');
  const [baseline,setBaseline]=useState(()=>JSON.stringify(catalog.settings));const discard=useRef(false);
  const dirty=JSON.stringify(draft)!==baseline;useDraftNavigation('settings',draft,dirty,discard);
  const change=(key,value)=>setDraft(prev=>({...prev,[key]:value}));
  const save=e=>{e.preventDefault();try{
    if(!draft.name.trim()||!/^\S+@\S+\.\S+$/.test(draft.email)||!/^0\d{9}$/.test(draft.phone)||!draft.branch.trim())throw new Error('Kiểm tra tên cửa hàng, email, số điện thoại 10 chữ số và địa chỉ chi nhánh.');
    if(['shippingFee','freeShipping'].some(key=>draft[key]===''||!Number.isSafeInteger(Number(draft[key]))||Number(draft[key])<0))throw new Error('Phí và ngưỡng miễn phí phải là số nguyên không âm.');
    for(const banner of draft.banners){if(!banner.title.trim())throw new Error('Nhập tiêu đề cho từng banner.');if(!/^\/(?!\/)/.test(banner.link)||banner.link.includes('\\'))throw new Error('Liên kết banner phải là đường dẫn nội bộ bắt đầu bằng một dấu /.');}
    if(draft.featured.some(id=>!catalog.products.some(p=>p.id===id&&p.status==='active')))throw new Error('Chỉ chọn sản phẩm đang bán cho bộ sưu tập nổi bật.');
    const saved={...draft,version:draft.version+1,shippingFee:Number(draft.shippingFee),freeShipping:Number(draft.freeShipping)};
    mutate(current=>{if(current.settings.version!==draft.version)throw new Error('Cấu hình đã thay đổi. Tải lại bản đã lưu.');return {...current,settings:saved};});setDraft(saved);setBaseline(JSON.stringify(saved));setError('');
  }catch(err){setError(err.message);}};
  if(scenario==='forbidden')return <Empty title="Không có quyền xem cấu hình" />;
  if(scenario==='loading')return <div className="admin-loading" role="status">Đang tải cấu hình…</div>;
  return <><PageHeading title="Cài đặt cửa hàng" /><form onSubmit={save} className="admin-form" noValidate><div className="admin-tabs">{[['banners','Banner trang chủ'],['featured','Sản phẩm nổi bật'],['store','Cửa hàng & giao hàng']].map(([key,label])=><button type="button" key={key} aria-pressed={tab===key} onClick={()=>setTab(key)}>{label}</button>)}</div>{error&&<Alert>{error}</Alert>}
    {tab==='banners'&&<Panel title="Banner trang chủ" actions={<Button size="compact" emphasis="outline" onClick={()=>change('banners',[...draft.banners,{id:crypto.randomUUID(),title:'',link:'/products',active:false}])}>Thêm banner</Button>}>{draft.banners.length?draft.banners.map((b,index)=><fieldset className="admin-variant" key={b.id}><legend>Banner {index+1}</legend><div className="admin-field-grid"><FormField label="Tiêu đề banner" value={b.title} onChange={e=>change('banners',draft.banners.map(item=>item.id===b.id?{...item,title:e.target.value}:item))} /><FormField label="Liên kết nội bộ" value={b.link} onChange={e=>change('banners',draft.banners.map(item=>item.id===b.id?{...item,link:e.target.value}:item))} /></div><label><input type="checkbox" checked={b.active} onChange={e=>change('banners',draft.banners.map(item=>item.id===b.id?{...item,active:e.target.checked}:item))} /> Hiển thị trên trang chủ</label><div className="admin-actions"><Button size="compact" emphasis="outline" disabled={index===0} onClick={()=>{const next=[...draft.banners];[next[index-1],next[index]]=[next[index],next[index-1]];change('banners',next);}}>Đưa lên</Button><Button size="compact" emphasis="outline" onClick={()=>change('banners',draft.banners.filter(item=>item.id!==b.id))}>Xóa banner</Button></div><div className="admin-banner-preview"><span>Chạm Tech</span><h2>{b.title||'Tiêu đề banner'}</h2><span>Khám phá sản phẩm</span></div></fieldset>):<p>Chưa có banner nào.</p>}</Panel>}
    {tab==='featured'&&<Panel title="Bộ sưu tập nổi bật"><div className="admin-check-list">{catalog.products.filter(p=>p.status==='active').map(p=><label key={p.id}><input type="checkbox" checked={draft.featured.includes(p.id)} onChange={e=>change('featured',e.target.checked?[...draft.featured,p.id]:draft.featured.filter(id=>id!==p.id))} />{p.name}</label>)}</div></Panel>}
    {tab==='store'&&<Panel title="Thông tin cửa hàng & phí giao hàng"><div className="admin-field-grid">{[['name','Tên cửa hàng'],['email','Email liên hệ'],['phone','Điện thoại'],['branch','Địa chỉ chi nhánh'],['shippingFee','Phí giao hàng mặc định (VND)'],['freeShipping','Ngưỡng miễn phí vận chuyển (VND)']].map(([key,label])=><FormField key={key} label={label} value={draft[key]} type={['shippingFee','freeShipping'].includes(key)?'number':'text'} onChange={e=>change(key,e.target.value)} />)}</div></Panel>}
    <div className="admin-save-bar"><span>{dirty?'Có thay đổi chưa lưu':''}</span><div className="admin-actions"><Button size="compact" emphasis="outline" onClick={()=>{setDraft(structuredClone(catalog.settings));setBaseline(JSON.stringify(catalog.settings));setError('');}}>Khôi phục bản đã lưu</Button><Button size="compact" type="submit">Lưu cấu hình</Button></div></div></form></>;
}
