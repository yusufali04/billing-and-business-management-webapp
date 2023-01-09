const {PDFDocument} = require('pdf-lib');
const {readFile, writeFile} = require('fs/promises');
const _ = require('lodash');
const { stringify } = require('querystring');

const date = new Date();
let year = date.getFullYear();

async function buildPDF(data, fileURL, outputName){

    const doc = await PDFDocument.load(await readFile(fileURL));


    const fieldNames = doc.getForm().getFields().map((f)=>f.getName());
    
    const form = doc.getForm();
    

    form.getTextField('customer_name').setText(data.customer_name);
    form.getTextField('customer_address').setText(data.customer_address);
    form.getTextField('customer_gstin').setText(data.customer_gstin);

    if(data.invoiceYear){
        form.getTextField('invoice_no').setText('MJ'+data.invoiceYear+data.invoiceNo);
    }
    else{
        form.getTextField('invoice_no').setText('MJ'+year+data.invoiceNo);
    }
    
    form.getTextField('invoice_date').setText(data.invoiceDate);
    form.getTextField('invoice_time').setText(data.invoiceTime);  
    form.getTextField('slno').setText("1");
    form.getTextField('item_description').setText(data.itemDescription);

    var gross = (data.grossWeight).toLocaleString("en-IN",{maximumFractionDigits: 2});
    form.getTextField('gross_weight').setText(gross+"g");

    var net = (data.netWeight).toLocaleString("en-IN",{maximumFractionDigits: 3});
    form.getTextField('net_weight').setText(net+"g");
    form.getTextField('lbr').setText("Rs."+data.lbr);
    form.getTextField('amount').setText(data.amount);
    form.getTextField('subtotal').setText(data.subTotal);
    const hsn = (data.hsn).toString();
    form.getTextField('hsn').setText(hsn);
    
    
    var makingChargesAmount = (data.makingChargesAmount).toLocaleString("en-IN",{maximumFractionDigits: 2});
    form.getTextField('makingcharges').setText(data.makingChargesPercentage+'%(Rs.'+makingChargesAmount+')');

    
    
    if(!data.cgst || !data.sgst){
        
        form.getTextField('cgst').setText("NA");
        form.getTextField('sgst').setText("NA");
    }
    else{
        var cgstAmount = (data.cgstAmount).toLocaleString("en-IN",{maximumFractionDigits: 2});
        var sgstAmount = (data.sgstAmount).toLocaleString("en-IN",{maximumFractionDigits: 2});
        form.getTextField('cgst').setText(data.cgst+"%(Rs."+cgstAmount+")");
        form.getTextField('sgst').setText(data.sgst+"%(Rs."+sgstAmount+")");
    }
    
    
    if(!data.igst){
        form.getTextField('igst').setText("NA");
    }
    else{
        var igstAmount = (data.igstAmount).toLocaleString("en-IN",{maximumFractionDigits: 2});
        form.getTextField('igst').setText(data.igst+"%(Rs."+igstAmount+")");
    }
    
    form.getTextField('total').setText(data.total);
    
    form.getTextField('amount_in_words').setText(data.amountInWords);

    form.flatten();


    const pdfBytes = await doc.save();


    await writeFile(outputName, pdfBytes);

}


module.exports = {buildPDF};