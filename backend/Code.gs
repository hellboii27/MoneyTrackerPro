/**
 * Money Tracker Pro v4.3.1 | © 2026 Bayu Wicaksono
 */

// [CONFIG] Konfigurasi global spreadsheet dan zona waktu
const SS = SpreadsheetApp.getActiveSpreadsheet();
const SH_TRX = SS.getSheetByName('Transaksi');
const SH_WAL = SS.getSheetByName('Wallets');
const TZ = Session.getScriptTimeZone();
const CACHE = CacheService.getScriptCache();
const WALLET_CACHE_KEY = "wallet_balances";
const DASH_CACHE_PREFIX = "dash_cache_";

// [API] Handle request web app entry point
function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('Money Tracker Pro')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// [UTIL] Generate unique identifier UUID
function generateId(){ return Utilities.getUuid(); }

// [VALIDATION] Validasi payload transaksi sebelum disimpan
function validateTransaksi(p){
  if(!p) throw new Error("Payload kosong");
  if(!p.wallet) throw new Error("Wallet kosong");
  if(!p.tgl) throw new Error("Tanggal wajib diisi");
  const nominal = Number(p.jumlah);
  if(!nominal || nominal <= 0) throw new Error("Nominal tidak valid");
  if(p.tipe==="Transfer"){
    if(!p.walletTujuan) throw new Error("Wallet tujuan wajib");
    if(p.wallet===p.walletTujuan) throw new Error("Wallet sumber dan tujuan tidak boleh sama");
  }
}

// [PERF] Hapus cache dashboard saat data berubah
function clearDashboardCache() {
  CACHE.remove(WALLET_CACHE_KEY);
}

// [DB] Ambil saldo tiap dompet dari sheet Wallets
function getWalletBalances(){
  const cached = CACHE.get(WALLET_CACHE_KEY);
  if(cached) return JSON.parse(cached);
  const lastRow = SH_WAL.getLastRow();
  if(lastRow <= 1) return [];
  const data = SH_WAL.getRange(2,1,lastRow-1,2).getValues();
  const res = data.map(r => ({name:r[0], balance:Number(r[1])}));
  CACHE.put(WALLET_CACHE_KEY, JSON.stringify(res), 600);
  return res;
}

// [DB] Perbarui nilai saldo pada dompet spesifik
function updateBalance(name, amt){
  const lastRow = SH_WAL.getLastRow();
  if(lastRow <= 1) return;
  const range = SH_WAL.getRange(2,1,lastRow-1,2);
  const data = range.getValues();
  for(let i=0;i<data.length;i++){
    if(data[i][0]===name){
      range.getCell(i+1,2).setValue(Number(data[i][1])+amt);
      clearDashboardCache();
      return;
    }
  }
  throw new Error("Wallet not found: " + name);
}

// [DB] Simpan data transaksi baru atau delegasi ke update
function simpanTransaksi(p){
  validateTransaksi(p);
  const tgl = new Date(p.tgl);
  const nominal = Number(p.jumlah);
  const kategoriFinal = (p.kategori === 'Lainnya' && p.kategoriKustom) ? p.kategoriKustom : p.kategori;
  const trxId = p.trxId || generateId();
  if(p.rowId){
    updateExistingTransaction(p);
    return true;
  }
  if(p.tipe==="Transfer"){
    SH_TRX.appendRow([tgl,'Transfer Out','Sistem',p.wallet,nominal,`Ke: ${p.walletTujuan} | ${p.catatan}`,trxId]);
    SH_TRX.appendRow([tgl,'Transfer In','Sistem',p.walletTujuan,nominal,`Dari: ${p.wallet} | ${p.catatan}`,trxId]);
    updateBalance(p.wallet,-nominal);
    updateBalance(p.walletTujuan,nominal);
  }else{
    SH_TRX.appendRow([tgl,p.tipe,kategoriFinal,p.wallet,nominal,p.catatan,trxId]);
    updateBalance(p.wallet,p.tipe==='Pemasukan'?nominal:-nominal);
  }
  return true;
}

// [DB] Update data transaksi lama dengan menghapus dan menulis ulang
function updateExistingTransaction(p){
  const row = Number(p.rowId);
  if(row<=1) throw new Error("Row invalid");
  const old = SH_TRX.getRange(row,1,1,7).getValues()[0];
  const trxId = old[6];
  if(trxId) deleteByTransactionId(trxId);
  else { revertBalance(old); SH_TRX.deleteRow(row); }
  simpanTransaksi({...p, kategori: p.kategori || old[2], trxId: p.trxId || old[6], rowId:null});
}

// [CALC] Kembalikan saldo sebelum transaksi dihapus/diubah
function revertBalance(row){
  const tipe=row[1], wallet=row[3], nominal=Number(row[4]);
  if(tipe==='Pemasukan'||tipe==='Transfer In') updateBalance(wallet,-nominal);
  else if(tipe==='Pengeluaran'||tipe==='Transfer Out') updateBalance(wallet,nominal);
}

// [DB] Hapus transaksi tunggal berdasarkan nomor baris
function hapusTransaksi(rowId){
  const row = Number(rowId);
  if(row<=1) return false;
  const data = SH_TRX.getRange(row,1,1,7).getValues()[0];
  const trxId = data[6];
  if(trxId) deleteByTransactionId(trxId);
  else { revertBalance(data); SH_TRX.deleteRow(row); }
  return true;
}

// [DB] Hapus transaksi berdasarkan ID unik (untuk sepasang transfer)
function deleteByTransactionId(trxId){
  const values = SH_TRX.getDataRange().getValues();
  for(let i=values.length-1;i>=1;i--){
    if(values[i][6]===trxId){
      revertBalance(values[i]);
      SH_TRX.deleteRow(i+1);
    }
  }
}

// [DB] Ambil riwayat transaksi dengan filter tipe dan tanggal
function getTransactions(f){
  const lastRow=SH_TRX.getLastRow();
  if(lastRow<=1) return [];
  const values=SH_TRX.getRange(2,1,lastRow-1,7).getValues();
  const start=new Date(f.start);
  const end=new Date(f.end);
  end.setHours(23,59,59);
  const result=[];
  for(let i=0;i<values.length;i++){
    const r=values[i];
    if(!r[0]) continue;
    const d=new Date(r[0]);
    const matchTipe= f.tipe==='Semua'|| r[1]===f.tipe|| (f.tipe==='Pemasukan'&&r[1]==='Transfer In')|| (f.tipe==='Pengeluaran'&&r[1]==='Transfer Out');
    if(d>=start&&d<=end&&matchTipe){
      result.push({
        tgl:Utilities.formatDate(r[0],TZ,"dd/MM"),
        tglRaw:Utilities.formatDate(r[0],TZ,"yyyy-MM-dd'T'HH:mm"),
        tipe:r[1], kat:r[2], wallet:r[3], nominal:r[4], note:r[5], row:i+2, trxId:r[6]
      });
    }
  }
  return result.sort((a,b)=>new Date(b.tglRaw)-new Date(a.tglRaw));
}

// [PERF] Agregasi data dashboard menggunakan mekanisme caching
function getDashboardData(f){
  const cacheKey = DASH_CACHE_PREFIX + Utilities.base64Encode(JSON.stringify(f));
  const cached = CACHE.get(cacheKey);
  if(cached) return JSON.parse(cached);
  const trx=SH_TRX.getDataRange().getValues().slice(1);
  const wal=SH_WAL.getDataRange().getValues().slice(1);
  const start=new Date(f.start);
  const end=new Date(f.end);
  end.setHours(23,59,59);
  let totalSemua=0;
  const walletDetails=wal.map(r=>{
    totalSemua+=Number(r[1]);
    return {name:r[0],balance:Number(r[1])};
  });
  let catStats={},totalFiltered=0;
  trx.forEach(r=>{
    const d=new Date(r[0]);
    if(d>=start&&d<=end&&r[1]===f.tipe){
      const nom=Number(r[4]);
      catStats[r[2]]=(catStats[r[2]]||0)+nom;
      totalFiltered+=nom;
    }
  });
  const finalResult = {totalSemua,walletDetails,catStats,totalFiltered};
  CACHE.put(cacheKey, JSON.stringify(finalResult), 600);
  return finalResult;
}

// [DB] Ambil data detail untuk kebutuhan laporan CSV
function getExportData(params){
  const startStr = Array.isArray(params) ? params[0] : params.start;
  const endStr = Array.isArray(params) ? params[1] : params.end;
  if(!startStr || !endStr) throw new Error("Invalid export date range");
  const start = new Date(startStr);
  const end = new Date(endStr);
  end.setHours(23,59,59);
  if(isNaN(start) || isNaN(end)) throw new Error("Invalid date format");
  const data = SH_TRX.getDataRange().getValues();
  data.shift();
  data.sort((a,b)=>new Date(a[0]) - new Date(b[0]));
  let runningTotal = 0;
  const exportData = [];
  const yearSuffix = new Date().getFullYear();
  for(let i=0;i<data.length;i++){
    const r = data[i];
    if(!r[0]) continue;
    const tglTrx = new Date(r[0]);
    if(isNaN(tglTrx)) continue;
    const nominal = Number(r[4]) || 0;
    const isDebit = (r[1]==='Pemasukan' || r[1]==='Transfer In');
    runningTotal += isDebit ? nominal : -nominal;
    if(tglTrx >= start && tglTrx <= end){
      exportData.push({
        kode: `PP${yearSuffix}-${String(i+1).padStart(3,'0')}`,
        tgl: Utilities.formatDate(tglTrx,TZ,"dd/MM/yyyy"),
        wallet: r[3] || "-",
        keterangan: r[2] || "-",
        catatan: r[5] || "-",
        debit: isDebit ? nominal : 0,
        kredit: !isDebit ? nominal : 0,
        total: runningTotal
      });
    }
  }
  return exportData;
}