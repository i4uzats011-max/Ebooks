import { CompanyProfile, Invoice, InvoiceItem } from './types';

export interface TaxCalculationResult {
  isIntraState: boolean;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTax: number;
  totalAmount: number;
}

export function calculateGSTLineItem(
  companyStateCode: number,
  partyStateCode: number,
  taxableAmount: number,
  gstRate: number,
  cessRate: number = 0
): TaxCalculationResult {
  const isIntraState = companyStateCode === partyStateCode;
  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isIntraState) {
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = parseFloat(((taxableAmount * cgstRate) / 100).toFixed(2));
    sgstAmount = parseFloat(((taxableAmount * sgstRate) / 100).toFixed(2));
  } else {
    igstRate = gstRate;
    igstAmount = parseFloat(((taxableAmount * igstRate) / 100).toFixed(2));
  }

  const cessAmount = parseFloat(((taxableAmount * cessRate) / 100).toFixed(2));
  const totalTax = cgstAmount + sgstAmount + igstAmount + cessAmount;
  const totalAmount = parseFloat((taxableAmount + totalTax).toFixed(2));

  return {
    isIntraState,
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    cessAmount,
    totalTax,
    totalAmount
  };
}

// Format Date to DD/MM/YYYY for GST Portal & E-Way Bill
export function formatToIndianDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// 1. Generate Official Government E-Way Bill JSON (Schema v1.0.1118)
export function generateEwayBillJSON(company: CompanyProfile, invoice: Invoice, items: InvoiceItem[]) {
  const isOutward = invoice.direction === 'OUTWARD';
  const docDate = formatToIndianDate(invoice.invoice_date);

  const ewbItem = {
    userGstin: company.gstin,
    supplyType: isOutward ? 'O' : 'I',
    subSupplyType: 1, // Supply
    subSupplyDesc: '',
    docType: invoice.invoice_type === 'BILL_OF_SUPPLY' ? 'BIL' : invoice.invoice_type === 'CHALLAN' ? 'CHL' : 'INV',
    docNo: invoice.invoice_no.replace(/[^a-zA-Z0-9/-]/g, ''),
    docDate: docDate,
    transType: 1, // Regular

    // From (Consignor / Supplier)
    fromGstin: isOutward ? company.gstin : invoice.party_gstin || 'URP',
    fromTrdName: isOutward ? company.company_name : invoice.party_name,
    fromAddr1: isOutward ? company.address_line1 : invoice.party_address || 'Consignor Address',
    fromAddr2: isOutward ? company.address_line2 || '' : '',
    fromPlace: isOutward ? company.city : 'CITY',
    fromPincode: isOutward ? company.pincode : invoice.party_pincode || 100000,
    fromStateCode: isOutward ? company.state_code : invoice.party_state_code,
    actualFromStateCode: isOutward ? company.state_code : invoice.party_state_code,

    // To (Consignee / Recipient)
    toGstin: isOutward ? invoice.party_gstin || 'URP' : company.gstin,
    toTrdName: isOutward ? invoice.party_name : company.company_name,
    toAddr1: isOutward ? invoice.party_address || 'Consignee Address' : company.address_line1,
    toAddr2: '',
    toPlace: isOutward ? invoice.place_of_supply.split('-')[1] || invoice.place_of_supply : company.city,
    toPincode: isOutward ? invoice.party_pincode || 400001 : company.pincode,
    toStateCode: isOutward ? invoice.party_state_code : company.state_code,
    actualToStateCode: isOutward ? invoice.party_state_code : company.state_code,

    // Totals
    totalValue: Number(invoice.taxable_value),
    cgstValue: Number(invoice.cgst_amount),
    sgstValue: Number(invoice.sgst_amount),
    igstValue: Number(invoice.igst_amount),
    cessValue: Number(invoice.cess_amount || 0),
    TotNonAdvolVal: 0,
    OthValue: 0,
    totInvValue: Number(invoice.total_amount),

    // Transport Details
    transMode: invoice.trans_mode || 1,
    transDistance: invoice.trans_distance || 50,
    transporterName: invoice.transporter_name || '',
    transporterId: invoice.transporter_id || '',
    transDocNo: '',
    transDocDate: '',
    vehicleNo: invoice.vehicle_no || 'MH12RN4590',
    vehicleType: invoice.vehicle_type || 'R',
    mainHsnCode: items[0]?.hsn_code || '73181500',

    // Items list
    itemList: items.map((itm, idx) => ({
      itemNo: idx + 1,
      productName: itm.product_name,
      productDesc: itm.product_name,
      hsnCode: itm.hsn_code,
      quantity: Number(itm.primary_qty),
      qtyUnit: itm.primary_unit,
      taxableAmount: Number(itm.taxable_amount),
      sgstRate: Number(itm.sgst_rate || 0),
      cgstRate: Number(itm.cgst_rate || 0),
      igstRate: Number(itm.igst_rate || 0),
      cessRate: Number(itm.cess_rate || 0),
      cessNonAdvol: 0
    }))
  };

  return {
    version: '1.0.1118',
    billLists: [ewbItem]
  };
}

// 2. Generate Official GSTR-1 JSON (Outward Supplies Return)
export function generateGSTR1JSON(company: CompanyProfile, invoices: (Invoice & { items: InvoiceItem[] })[], fp: string = '102026') {
  const outwardInvoices = invoices.filter(inv => inv.direction === 'OUTWARD');

  // B2B Grouping by party GSTIN
  const b2bMap = new Map<string, any>();
  const b2csMap = new Map<string, any>();
  const hsnMap = new Map<string, any>();

  for (const inv of outwardInvoices) {
    const isRegistered = inv.party_gstin && inv.party_gstin.length === 15 && inv.party_gstin !== 'URP';
    const isInterState = inv.party_state_code !== company.state_code;
    const invDate = formatToIndianDate(inv.invoice_date);

    if (isRegistered) {
      if (!b2bMap.has(inv.party_gstin!)) {
        b2bMap.set(inv.party_gstin!, {
          ctin: inv.party_gstin,
          inv: []
        });
      }

      const invRecord = {
        inum: inv.invoice_no,
        idt: invDate,
        val: Number(inv.total_amount),
        pos: String(inv.party_state_code).padStart(2, '0'),
        rchrg: 'N',
        inv_typ: 'R',
        itms: (inv.items || []).map((itm, idx) => ({
          num: idx + 1,
          itm_det: {
            rt: Number(itm.gst_rate),
            txval: Number(itm.taxable_amount),
            iamt: Number(itm.igst_amount || 0),
            camt: Number(itm.cgst_amount || 0),
            samt: Number(itm.sgst_amount || 0),
            csamt: Number(itm.cess_amount || 0)
          }
        }))
      };
      b2bMap.get(inv.party_gstin!)?.inv.push(invRecord);
    } else {
      // B2C Small
      const key = `${inv.party_state_code}_${inv.items?.[0]?.gst_rate || 18}`;
      if (!b2csMap.has(key)) {
        b2csMap.set(key, {
          sply_ty: isInterState ? 'INTER' : 'INTRA',
          pos: String(inv.party_state_code).padStart(2, '0'),
          typ: 'OE',
          rt: Number(inv.items?.[0]?.gst_rate || 18),
          txval: 0,
          iamt: 0,
          camt: 0,
          samt: 0,
          csamt: 0
        });
      }
      const b2csRecord = b2csMap.get(key);
      b2csRecord.txval += Number(inv.taxable_value);
      b2csRecord.iamt += Number(inv.igst_amount);
      b2csRecord.camt += Number(inv.cgst_amount);
      b2csRecord.samt += Number(inv.sgst_amount);
    }

    // HSN aggregation
    for (const itm of inv.items || []) {
      const hsnKey = `${itm.hsn_code}_${itm.primary_unit}`;
      if (!hsnMap.has(hsnKey)) {
        hsnMap.set(hsnKey, {
          num: hsnMap.size + 1,
          hsn_sc: itm.hsn_code,
          desc: itm.product_name,
          uqc: itm.primary_unit,
          qty: 0,
          val: 0,
          txval: 0,
          iamt: 0,
          camt: 0,
          samt: 0,
          csamt: 0
        });
      }
      const hsnRecord = hsnMap.get(hsnKey);
      hsnRecord.qty += Number(itm.primary_qty);
      hsnRecord.val += Number(itm.total_amount);
      hsnRecord.txval += Number(itm.taxable_amount);
      hsnRecord.iamt += Number(itm.igst_amount || 0);
      hsnRecord.camt += Number(itm.cgst_amount || 0);
      hsnRecord.samt += Number(itm.sgst_amount || 0);
      hsnRecord.csamt += Number(itm.cess_amount || 0);
    }
  }

  return {
    gstin: company.gstin,
    fp: fp, // Return Period e.g. '102026' (MMYYYY)
    b2b: Array.from(b2bMap.values()),
    b2cl: [],
    b2cs: Array.from(b2csMap.values()),
    hsn: {
      data: Array.from(hsnMap.values())
    },
    doc_issue: {
      doc_det: [
        {
          doc_num: 1,
          doc_typ: 'Invoices for outward supply',
          docs: [
            {
              num: 1,
              from: outwardInvoices[0]?.invoice_no || 'INV/26-27/0001',
              to: outwardInvoices[outwardInvoices.length - 1]?.invoice_no || 'INV/26-27/0001',
              totnum: outwardInvoices.length,
              canc: 0,
              net_issue: outwardInvoices.length
            }
          ]
        }
      ]
    }
  };
}

// 3. Generate GSTR-3B Calculation and Government JSON
export function generateGSTR3BJSON(company: CompanyProfile, invoices: (Invoice & { items: InvoiceItem[] })[], fp: string = '102026') {
  const outward = invoices.filter(i => i.direction === 'OUTWARD');
  const inward = invoices.filter(i => i.direction === 'INWARD');

  // Outward Supplies (Table 3.1)
  const totalOutwardTaxable = outward.reduce((s, i) => s + Number(i.taxable_value), 0);
  const totalOutwardIamt = outward.reduce((s, i) => s + Number(i.igst_amount), 0);
  const totalOutwardCamt = outward.reduce((s, i) => s + Number(i.cgst_amount), 0);
  const totalOutwardSamt = outward.reduce((s, i) => s + Number(i.sgst_amount), 0);
  const totalOutwardCsamt = outward.reduce((s, i) => s + Number(i.cess_amount || 0), 0);

  // Inward Supplies / Eligible ITC (Table 4)
  const totalItcIamt = inward.reduce((s, i) => s + Number(i.igst_amount), 0);
  const totalItcCamt = inward.reduce((s, i) => s + Number(i.cgst_amount), 0);
  const totalItcSamt = inward.reduce((s, i) => s + Number(i.sgst_amount), 0);
  const totalItcCsamt = inward.reduce((s, i) => s + Number(i.cess_amount || 0), 0);

  // Net Tax Payable (Table 6.1)
  const netIamtPayable = Math.max(0, totalOutwardIamt - totalItcIamt);
  const netCamtPayable = Math.max(0, totalOutwardCamt - totalItcCamt);
  const netSamtPayable = Math.max(0, totalOutwardSamt - totalItcSamt);

  return {
    gstin: company.gstin,
    ret_period: fp,
    sec_sum: {
      table3_1: {
        osup_det: {
          txval: totalOutwardTaxable,
          iamt: totalOutwardIamt,
          camt: totalOutwardCamt,
          samt: totalOutwardSamt,
          csamt: totalOutwardCsamt
        },
        osup_zero: { txval: 0, iamt: 0, csamt: 0 },
        osup_nil_exmp: { txval: 0 },
        isup_rev: { txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 },
        osup_nongst: { txval: 0 }
      },
      table4: {
        itc_avl: [
          {
            ty: 'OTH', // All other ITC
            iamt: totalItcIamt,
            camt: totalItcCamt,
            samt: totalItcSamt,
            csamt: totalItcCsamt
          }
        ],
        itc_rev: [],
        itc_net: {
          iamt: totalItcIamt,
          camt: totalItcCamt,
          samt: totalItcSamt,
          csamt: totalItcCsamt
        },
        itc_inelg: []
      },
      table6_1: {
        tax_payable: {
          iamt: totalOutwardIamt,
          camt: totalOutwardCamt,
          samt: totalOutwardSamt,
          csamt: totalOutwardCsamt
        },
        paid_through_itc: {
          iamt: Math.min(totalOutwardIamt, totalItcIamt),
          camt: Math.min(totalOutwardCamt, totalItcCamt),
          samt: Math.min(totalOutwardSamt, totalItcSamt),
          csamt: Math.min(totalOutwardCsamt, totalItcCsamt)
        },
        paid_in_cash: {
          iamt: netIamtPayable,
          camt: netCamtPayable,
          samt: netSamtPayable,
          csamt: 0
        }
      }
    }
  };
}
