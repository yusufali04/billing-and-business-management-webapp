const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const billSchema = new Schema({
    customer_name: {type: String},
    customer_address: {type: String},
    customer_gstin: {type: String},
    itemDescription: {type: String},
    lbr: {type: Number},
    cgst: {type: Number},
    cgstAmount: {type: Number},
    igst: {type: Number},
    igstAmount: {type: Number},
    sgst: {type: Number},
    sgstAmount: {type: Number},
    grossWeight: {type: Number},
    netWeight: {type: Number},
    amount: {type: String},
    subTotal: {type: String},
    total: {type: String},
    amountInWords: {type: String},
    invoiceNo: {type: Number,default: 100},
    invoiceDate: {type: String},
    invoiceTime: {type: String},
    invoiceYear: {type: String},
    makingChargesPercentage: {type: Number},
    makingChargesAmount: {type: Number},
    hsn: {type: Number}
});




module.exports = mongoose.model('Bill', billSchema);