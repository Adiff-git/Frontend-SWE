export function downloadText(name, text, type = 'text/csv;charset=utf-8') {
  const url=URL.createObjectURL(new Blob(['\uFEFF',text],{type}));const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
