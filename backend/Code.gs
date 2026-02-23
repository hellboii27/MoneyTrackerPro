/**
 * Money Tracker Pro v4.2.1-Optimized | © 2026 Bayu Wicaksono
 */

// --- Global Spreadsheet Configuration ---
const SS = SpreadsheetApp.getActiveSpreadsheet();
const SH_TRX = SS.getSheetByName('Transaksi');
const SH_WAL = SS.getSheetByName('Wallets');
const TZ = "GMT+7";

/** Application entry point: Renders the web interface with security headers. */
function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('Money Tracker Pro')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Fetches all wallet entities and current balance states. */
function getWalletBalances() {
  const lastRow = SH_WAL.getLastRow();
  if (lastRow <= 1) return [];
  const data = SH_WAL.getRange(2, 1, lastRow - 1, 2).getValues();
  return data.map(r => ({ name: r[0], balance: r[1] }));
}

/** Handles transaction persistence, edit-mode validation, and balance sync. */
function simpanTransaksi(p) {
  const tgl = new Date(p.tgl);
  const nominal = Number(p.jumlah);
  const kategoriFinal = (p.kategori === 'Lainnya' && p.kategoriKustom) ? p.kategoriKustom : p.kategori;

  if (p.rowId) hapusTransaksi(p.rowId);

  if (p.tipe === 'Transfer') {
    SH_TRX.appendRow([tgl, 'Transfer Out', 'Sistem', p.wallet, nominal, `Ke: ${p.walletTujuan} | ${p.catatan}`]);
    SH_TRX.appendRow([tgl, 'Transfer In', 'Sistem', p.walletTujuan, nominal, `Dari: ${p.wallet} | ${p.catatan}`]);
    updateBalance(p.wallet, -nominal);
    updateBalance(p.walletTujuan, nominal);
  } else {
    SH_TRX.appendRow([tgl, p.tipe, kategoriFinal, p.wallet, nominal, p.catatan]);
    updateBalance(p.wallet, p.tipe === 'Pemasukan' ? nominal : -nominal);
  }
  return true;
}

/** Deletes a transaction record and reverts its financial impact on the wallet. */
function hapusTransaksi(rowId) {
  const row = parseInt(rowId);
  if (row <= 1) return false;

  const data = SH_TRX.getRange(row, 1, 1, 6).getValues()[0];
  const tipe = data[1];
  const wallet = data[3];
  const nominal = Number(data[4]);

  if (tipe === 'Pemasukan' || tipe === 'Transfer In') updateBalance(wallet, -nominal);
  else if (tipe === 'Pengeluaran' || tipe === 'Transfer Out') updateBalance(wallet, nominal);

  SH_TRX.deleteRow(row);
  return true;
}

/** Atomic helper: Updates the numerical balance of a specific wallet. */
function updateBalance(name, amt) {
  const lastRow = SH_WAL.getLastRow();
  if (lastRow <= 1) return;

  const range = SH_WAL.getRange(2, 1, lastRow - 1, 2);
  const data = range.getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === name) {
      range.getCell(i + 1, 2).setValue(Number(data[i][1]) + amt);
      return;
    }
  }
}

/** Retrieves filtered transaction logs with row ID mapping for CRUD operations. */
function getTransactions(f) {
  const values = SH_TRX.getDataRange().getValues();
  if (values.length <= 1) return [];

  const start = new Date(f.start);
  const end = new Date(f.end);
  end.setHours(23, 59, 59);

  const result = [];

  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!r[0]) continue;

    const d = new Date(r[0]);

    const matchTipe =
      f.tipe === 'Semua' ||
      r[1] === f.tipe ||
      (f.tipe === 'Pemasukan' && r[1] === 'Transfer In') ||
      (f.tipe === 'Pengeluaran' && r[1] === 'Transfer Out');

    if (d >= start && d <= end && matchTipe) {
      result.push({
        tgl: Utilities.formatDate(r[0], TZ, "dd/MM"),
        tglRaw: Utilities.formatDate(r[0], TZ, "yyyy-MM-dd'T'HH:mm"),
        tipe: r[1],
        kat: r[2],
        wallet: r[3],
        nominal: r[4],
        note: r[5],
        row: i + 1
      });
    }
  }

  return result.sort((a, b) => new Date(b.tglRaw) - new Date(a.tglRaw));
}

/** Aggregates financial analytics for dashboard visualization (Chart.js). */
function getDashboardData(f) {
  const trx = SH_TRX.getDataRange().getValues().slice(1);
  const wal = SH_WAL.getDataRange().getValues().slice(1);

  const start = new Date(f.start);
  const end = new Date(f.end);
  end.setHours(23, 59, 59);

  let totalSemua = 0;
  const walletDetails = wal.map(r => {
    totalSemua += Number(r[1]);
    return { name: r[0], balance: Number(r[1]) };
  });

  let catStats = {}, totalFiltered = 0;

  for (let i = 0; i < trx.length; i++) {
    const r = trx[i];
    const d = new Date(r[0]);
    if (d >= start && d <= end && r[1] === f.tipe) {
      const nom = Number(r[4]);
      catStats[r[2]] = (catStats[r[2]] || 0) + nom;
      totalFiltered += nom;
    }
  }

  return { totalSemua, walletDetails, catStats, totalFiltered };
}

/** Generates chronological export data with running balance calculations. */
function getExportData(startStr, endStr) {
  const data = SH_TRX.getDataRange().getValues();
  data.shift();

  const start = new Date(startStr);
  const end = new Date(endStr);
  end.setHours(23, 59, 59);

  data.sort((a, b) => new Date(a[0]) - new Date(b[0]));

  let runningTotal = 0;
  let exportData = [];
  const yearSuffix = new Date().getFullYear();

  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (!r[0]) continue;

    const tglTrx = new Date(r[0]);
    const nominal = Number(r[4]) || 0;
    const isDebit = (r[1] === 'Pemasukan' || r[1] === 'Transfer In');

    runningTotal += isDebit ? nominal : -nominal;

    if (tglTrx >= start && tglTrx <= end) {
      exportData.push({
        kode: `PP${yearSuffix}-${String(i + 1).padStart(3, '0')}`,
        tgl: Utilities.formatDate(tglTrx, TZ, "dd/MM/yyyy"),
        wallet: r[3],
        keterangan: r[2],
        catatan: r[5] || '-',
        debit: isDebit ? nominal : 0,
        kredit: !isDebit ? nominal : 0,
        total: runningTotal
      });
    }
  }

  return exportData;
}