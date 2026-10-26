exports.handler = async function(event) {
  const symbol = String(event.queryStringParameters?.symbol || "").toUpperCase();
  if (!/^[A-Z0-9.-]{1,8}$/.test(symbol)) return {statusCode:400,headers:{"content-type":"application/json"},body:JSON.stringify({ok:false,message:"Kode saham tidak valid."})};
  const key=process.env.SAHAM_API_KEY;
  if(!key)return {statusCode:500,headers:{"content-type":"application/json"},body:JSON.stringify({ok:false,message:"Variabel rahasia SAHAM_API_KEY belum diatur di Netlify."})};
  try{
    const r=await fetch("https://use.api.co.id/idx/v2/chart/daily/"+encodeURIComponent(symbol),{headers:{"x-api-co-id":key,"accept":"application/json"}});
    const raw=await r.text();let j;try{j=JSON.parse(raw)}catch{}
    if(!r.ok||!j||j.is_success===false)return {statusCode:r.status||502,headers:{"content-type":"application/json"},body:JSON.stringify({ok:false,message:j?.message||"API menolak permintaan (HTTP "+r.status+")."})};
    let d=j.data;if(d?.data!==undefined)d=d.data;let rows=Array.isArray(d)?d:null;
    if(!rows)for(const k of ["items","rows","candles","history","prices","results"])if(Array.isArray(d?.[k])){rows=d[k];break}
    if(!rows&&Array.isArray(j.items))rows=j.items;
    return {statusCode:200,headers:{"content-type":"application/json","cache-control":"public, max-age=60"},body:JSON.stringify({ok:true,symbol,rows:rows||[]})};
  }catch(e){return {statusCode:502,headers:{"content-type":"application/json"},body:JSON.stringify({ok:false,message:"Tidak dapat menghubungi penyedia API."})}}
};