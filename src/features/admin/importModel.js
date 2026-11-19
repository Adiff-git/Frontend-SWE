// Small explicit preview schema. Production schema/limits remain unapproved.
export const importHeaders=['name','sku','category','brand','price','stock'];
export function parseImport(text,catalog){
  const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);const headers=lines.shift()?.split(',').map(h=>h.trim());
  if(!headers||importHeaders.some((h,i)=>headers[i]!==h)||headers.length!==6)throw new Error(`Tệp CSV cần có đúng các cột: ${importHeaders.join(', ')}.`);
  const seen=new Set();return lines.map((line,index)=>{const cells=line.split(',').map(c=>c.trim());const [name,sku,categoryId,brandId,price,stock]=cells;let error='';
    if(cells.length!==6||!name||!sku)error='Thiếu dữ liệu hoặc sai định dạng 6 cột (không hỗ trợ dấu phẩy trong nội dung ô).';
    else if(seen.has(sku.toLowerCase())||catalog.products.some(p=>p.code.toLowerCase()===sku.toLowerCase()||p.variants.some(v=>v.sku.toLowerCase()===sku.toLowerCase())))error='SKU hoặc mã sản phẩm đã tồn tại; chức năng nhập chỉ hỗ trợ tạo mới.';
    else if(!catalog.categories.some(c=>c.id===categoryId&&c.active)||!catalog.brands.some(b=>b.id===brandId&&b.active))error='Danh mục hoặc thương hiệu không hợp lệ.';
    else if([price,stock].some(value=>value===''||!Number.isSafeInteger(Number(value))||Number(value)<0))error='Giá và tồn kho phải là số nguyên không âm.';
    seen.add((sku||'').toLowerCase());return {row:index+2,name,sku,categoryId,brandId,price:Number(price),stock:Number(stock),error};
  });
}
