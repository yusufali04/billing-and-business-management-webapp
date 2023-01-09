require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require(__dirname+'/models/user');
const Bill = require(__dirname+'/models/bills');
const Admin = require(__dirname+'/models/admin');
const Query = require(__dirname+'/models/queries');
const ejs = require("ejs");
const expressLayout = require("express-ejs-layouts");
const session = require("express-session");
const flash = require("express-flash")
const path = require("path");
const pdfService = require(__dirname+'/pdf-invoice');
const { ToWords } = require('to-words');
const user = require('./models/user');
const { INSPECT_MAX_BYTES } = require('buffer');
const startDownload = require(__dirname+'/start-download');
const PORT = process.env.PORT || 3600;
const guest = require(__dirname+'/middlewares/guest')
const _ = require('lodash');
const { toUpper } = require('lodash');


/********************Assests *********************/

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static('public'));





/*************************** */

// setting template engine

app.use(expressLayout);
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');


/***************************** */

////////// database Connection ////////////////


mongoose.connect(process.env.MONGO_CONNECTION_URL, {useNewUrlParser: true });

const connection=mongoose.connection;

connection.once('open',(err) => {

    if(!err){
    console.log('Database connected');
    }
    else{
        console.log('Database connection failed');
    }

});



/*****************session store in database ************/

let sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGO_CONNECTION_URL,
    collection: 'sessions'
});

/*************** creating session *************/

app.use(session({
    secret: process.env.SESSION_COOKIE_SECRET,
    resave: false,
    store: sessionStore,
    saveUninitialized: false,
    // cookie: {maxAge: 1000*60*60*24}
}));

app.use(flash());

/****************Passport Config *************/

const passportInit = require(__dirname + '/config/passport');
passportInit(passport)
app.use(passport.initialize());
app.use(passport.session());

/*********global middlewares */
app.use((req,res,next)=>{
    res.locals.session = req.session;
    res.locals.user = req.user;
    next();
})

/*************Configuring to-words ***********/

const toWords = new ToWords({
    localeCode: 'en-IN',
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
      doNotAddOnly: false,
      currencyOptions: { // can be used to override defaults for the selected locale
        name: 'Rupee',
        plural: 'Rupees',
        symbol: '₹',
        fractionalUnit: {
          name: 'Paisa',
          plural: 'Paise',
          symbol: '',
        },
      }
    }
  });

/********* Variable Declaration ******************/

const invoice_details = {

    customer_name: '',
    customer_address: '',
    customer_gstin: '',
    itemDescription: '',
    lbr: Number,
    cgst: Number,
    igst: Number,
    sgst: Number,
    grossWeight: Number,
    netWeight: Number,
    amount: '',
    subTotal: '',
    total: '',
    amountInWords: String,
    invoiceNo: Number,
    invoiceDate: String,
    invoiceTime: String,
    cgstAmount: Number,
    sgstAmount: Number,
    igstAmount: Number,
    makingChargesPercentage: Number,
    makingChargesAmount: Number,
    hsn: Number

};

let contacts = [
    {name: "SSG", address: "7-39,Main bazar,Chagalmarri-518553", gst: "37DQHPS5829H1Z8"},
    {name: "A.Muthyalababu Jewellers", address: "Shroff Merchants,Bresthwarpet,Raichur", gst: "29ALYPM8257E1Z9"},
    {name: "Kanakamahalaxmi Jewellers", address: "Netaji road,Shroff bazar,Raichur", gst: "29BHFPS2414D1ZH"},
    {name: "C.Noor Mohammed Jewellers", address: "Atmakur-518442", gst: "37AMNPM5825G1ZP"},
    {name: "Veeranna Goldsmith", address: "1-110,Main bazar,Kodumur,Kurnool,A.P", gst: "37ARZPS0108B12P"},
    {name: "Madeena Jewellers", address: "Atmakur-518442", gst: "37BHCPB2279L1Z8"},
    {name: "Sri Kanakadurga Jewellers", address: "Netaji road,Shroff bazar,Raichur", gst: "29AKQPS9898G1ZS"},
    {name: "Sri Matha Vaishnavidevi", address: "Shroff bazar,Mochiwada,Raichur-584101", gst: "29CCKPS0708M1Z1"},
    {name: "S.Akbar Hussain Jewellery", address: "Aasthanam Road,Banaganapalli-518124", gst: "37ADVPH2195P1ZL"},
]

var invoice;


                        /*************** GET Requests ***************/


app.get("/", (req, res)=>{
    res.render("home")
})



app.get("/gsthome", (req, res)=>{
    
    if(!req.isAuthenticated()){
        return res.redirect("/admin");
    } 

    Bill.find({}, (err, result)=>{
        if(result.length==0){
            const defaultBill = new Bill({
                invoiceNo: 100
            })
            defaultBill.save();
        }
    })
    res.render("gsthome");
});

app.get("/contactlist", (req, res)=>{
    if(!req.isAuthenticated()){
        return res.redirect("/");
    } 
    res.render('contactList', {contacts})
})

app.get("/admin", (req, res)=>{
    Admin.find({}, (err, result)=>{

        if(err){
            res.send(err);
        }
        else if(result.length==0){
            res.render("register");
        }
        else{
            if(req.isAuthenticated()){
                return res.redirect("/gsthome");
            } 
            res.render('login');
        }
    })
})



app.get("/regular", (req, res)=>{

    if(!req.isAuthenticated()){
        return res.redirect("/");
    } 
    res.render("regular");
    
    
});


app.get("/regulargst", (req, res)=>{

    if(!req.isAuthenticated()){
        return res.redirect("/");
    } 
    
    res.render("regulargst")
    
    
})

app.get("/reverse", (req, res)=>{
    
    if(!req.isAuthenticated()){
        return res.redirect("/");
    } 
    res.render("reverse");
});

app.get("/reversegst", (req, res)=>{

    if(!req.isAuthenticated()){
        return res.redirect("/");
    }
    
    res.render("reversegst")
    
});

app.get("/contact", (req, res)=>{
    res.render("contact")
})

app.get("/about", (req, res)=>{
    res.render("about")
})

app.get("/history", (req, res)=>{


    if(!req.isAuthenticated()){
        return res.redirect("/");
    } 

    Bill.find({}, (err, result)=>{
        result.reverse();
        res.render("history", {bills: result})
     })

   
    

})

app.get("/queries", (req, res)=>{
    if(!req.isAuthenticated()){
        return res.redirect("/");
    } 

    Query.find({}, (err, result)=>{
        if(err){
            res.send(err);
        }
        result.reverse();
        res.render("queries", {queries: result})
     })
})

// app.get("/invoice", (req, res)=>{
//     console.log(invoice);
    
//     res.render("bill", {bill: invoice})
// })

/**************************** Post requests *****************/

app.post("/register",async (req, res)=>{
    const {name, email, password} = req.body;
    if(!name || !email || !password){
        
        return res.redirect("/");
    }

    Admin.exists({email: email}, (err, result)=>{
        if(result){
            req.flash("register_error","*User already exists");
            return res.redirect("/")
        }
    });

    // hashing password
    const hashedPassword = await bcrypt.hash(password, 10);
    // create user
    const admin = new Admin({
        name: name,
        email: email,
        password: hashedPassword
    });

    admin.save().then(()=>{

        return res.redirect("/")
    }).catch(err=>{
        req.flash("register_error","*Something went wrong");
        return res.redirect("/");
    })
   
})

app.post("/login", (req, res, next)=>{
    
    passport.authenticate('local', (err, user, info)=>{
        if(err){
            req.flash('error', info.message)
            return next(err)
        }
        if(!user){
            req.flash('error', info.message)
            return res.redirect("/");
        }
        else if(user.role != "admin"){
            req.flash('error','*Sorry! You are not an authorised person')
            return res.redirect("/");
        }
        
        else{

            req.logIn(user, (err)=>{
                if(err){
                    req.flash('error', info.message)
                    return next(err);
                }
    
                return res.redirect('/gsthome')
            })

        }
        
        
    })(req, res, next)
    

})

app.post("/contactSelected", (req, res)=>{


    let contact = JSON.parse(req.body.contact);
    invoice_details.customer_name = contact.name
    invoice_details.customer_address = contact.address
    invoice_details.customer_gstin = contact.gst
    res.redirect('/reversegst')
})



app.post("/regular", (req, res)=>{

    
    const data = req.body;
    if(!data.customer_name || !data.customer_address || !data.customer_gstin){
        req.flash('regular_error', '* Please enter all the fields');
        return res.redirect("/regular")
    }
    invoice_details.customer_name = data.customer_name;
    invoice_details.customer_address = data.customer_address;
    invoice_details.customer_gstin = (data.customer_gstin).toUpperCase();
    res.redirect("/regulargst");

    

});

app.post("/regulargst", async (req, res)=>{

    const data = req.body;
    const date = new Date();
    

    var today = new Date(data.date);
    var singleDate  = today.getDate();
    var singleMonth = today.getMonth()+1;
    var singleYear = today.getFullYear();

    let invoiceDate = singleDate + '/' + singleMonth + '/'+ singleYear;
    let invoiceTime = date.toLocaleTimeString();

    invoice_details.makingChargesPercentage = data.makingChargesPercentage
    invoice_details.itemDescription = data.itemDescription;
    invoice_details.hsn = data.hsn;
    invoice_details.lbr = data.lbr;
    invoice_details.cgst = data.cgst;
    invoice_details.igst = data.igst;
    invoice_details.sgst = data.sgst;
    invoice_details.grossWeight = data.grossWeight;
    invoice_details.netWeight = data.netWeight;
    invoice_details.amount = "Rs."+ Number(data.amount).toLocaleString('en-IN',{maximumFractionDigits: 2});
    invoice_details.subTotal = "Rs."+ Number(data.amount).toLocaleString('en-IN',{maximumFractionDigits: 2});
    const makingChargesPercentage = parseFloat(data.makingChargesPercentage)

    const amountInt = parseFloat(data.amount);
    
    let totalFinal,cgstAmount,sgstAmount,igstAmount, makingChargesAmount;
     

    if(data.igst){
        
        const igstFloat = parseFloat(data.igst);
        makingChargesAmount = ((amountInt/100)*makingChargesPercentage);
        igstAmount = (((amountInt+makingChargesAmount)/100)*igstFloat);
        totalFinal = (amountInt/100*(igstFloat+makingChargesPercentage))+amountInt;
    }
    else if(!data.cgst || !data.sgst && !data.igst){
        req.flash('regulargst_error', '*Please enter both SGST and CGST (or) IGST');
        req.flash('description', data.itemDescription );
        req.flash('grossWeight', data.grossWeight)
        req.flash('netWeight', data.netWeight)
        req.flash('lbr', data.lbr);
        req.flash('amount', data.amount)
        return res.redirect('/regulargst')
    }
    else{
        const cgstFloat = parseFloat(data.cgst);
        const sgstFloat = parseFloat(data.sgst);
        makingChargesAmount = ((amountInt/100)*makingChargesPercentage);
        cgstAmount = (((amountInt+makingChargesAmount)/100)*cgstFloat);
        sgstAmount = (((amountInt+makingChargesAmount)/100)*sgstFloat);
        totalFinal = (amountInt/100*(cgstFloat+sgstFloat+makingChargesPercentage))+amountInt;
        
        
        
    }
    invoice_details.total = "Rs."+(totalFinal).toLocaleString('en-IN');
    invoice_details.amountInWords = toWords.convert(totalFinal).toUpperCase();
    invoice_details.makingChargesAmount = makingChargesAmount
    invoice_details.igstAmount = igstAmount;
    invoice_details.cgstAmount = cgstAmount;
    invoice_details.sgstAmount = sgstAmount;
    invoice_details.invoiceDate = invoiceDate;
    invoice_details.invoiceTime = invoiceTime;
  
    


    var temp = await Bill.find({}).sort({_id: -1}).limit(1).exec();
    
    invoice_details.invoiceNo =  temp[0].invoiceNo+1;
    
       
        


    

    pdfService.buildPDF(invoice_details,__dirname+"/template_editable.pdf","modified-form.pdf").then(()=>{
        startDownload.start(req, res);
   
    }).then(()=>{
            // saving bill in database

    const bill = new Bill({
        customer_name: invoice_details.customer_name,
        customer_address: invoice_details.customer_address,
        customer_gstin: invoice_details.customer_gstin,
        itemDescription: invoice_details.itemDescription,
        lbr: invoice_details.lbr,
        cgst: invoice_details.cgst,
        igst: invoice_details.igst,
        sgst: invoice_details.sgst,
        grossWeight: invoice_details.grossWeight,
        netWeight: invoice_details.netWeight,
        amount: invoice_details.amount,
        subTotal: invoice_details.subTotal,
        total: invoice_details.total,
        amountInWords: invoice_details.amountInWords,
        invoiceNo: invoice_details.invoiceNo,
        invoiceDate: invoice_details.invoiceDate,
        invoiceTime: invoice_details.invoiceTime,
        igstAmount: invoice_details.igstAmount,
        cgstAmount: invoice_details.cgstAmount,
        sgstAmount: invoice_details.sgstAmount,
        invoiceYear: singleYear,
        makingChargesPercentage: invoice_details.makingChargesPercentage,
        makingChargesAmount: invoice_details.makingChargesAmount,
        hsn: invoice_details.hsn

        
    });
    bill.save((err)=>{
        if(err){
            res.send("Something went wrong, Please try again")
        }
    });
    //saved
    });

    
   
});


app.post("/reverse", (req, res)=>{
    const data = req.body;
    if(!data.customer_name || !data.customer_address || !data.customer_gstin){
        req.flash('reverse_error', '* Please enter all the fields');
        return res.redirect("/reverse")
    }
    
    invoice_details.customer_name = data.customer_name;
    invoice_details.customer_address = data.customer_address; 
    invoice_details.customer_gstin = (data.customer_gstin).toUpperCase();
    res.redirect("/reversegst");
});

app.post("/reversegst", async (req, res)=>{


    const data = req.body;
    const date = new Date();
    
    var today = new Date(data.date);
    var singleDate  = today.getDate();
    var singleMonth = today.getMonth()+1;
    var singleYear = today.getFullYear();


    // Building Time String

    const hourString = (date.getHours() % 12 || 12).toString();
    const minutesString = date.getMinutes().toString()
    const secondsString = date.getSeconds().toString()

    const hours = hourString.length == 1 ? ('0'+ hourString) : hourString
    const minutes = minutesString.length == 1 ? ('0'+ minutesString) : minutesString
    const seconds = secondsString.length == 1 ? ('0'+ secondsString) : secondsString
    const amPm = date.getHours() >= 12 ? 'PM' : 'AM'

    //building date string

    const dayString = (today.getDate()).toString();
    const monthString = (today.getMonth()+1).toString()
    const yearString = today.getFullYear().toString()


    const day = dayString.length == 1 ? ('0'+ dayString) : dayString
    const month = monthString.length == 1 ? ('0'+ monthString) : monthString

    let invoiceDate = day + '/' + month + '/'+ yearString;

    let invoiceTime = hours +':'+ minutes + ':' + seconds + ' ' + amPm;

    invoice_details.itemDescription = data.itemDescription;
    invoice_details.hsn = data.hsn;
    invoice_details.lbr = data.lbr;
    invoice_details.cgst = data.cgst;
    invoice_details.igst = data.igst;
    invoice_details.sgst = data.sgst;
    invoice_details.total = "Rs."+ Number(data.amount).toLocaleString('en-IN',{maximumFractionDigits: 2});
    
    const makingChargesPercentage = parseFloat(data.makingChargesPercentage)
    const grossWeightPercentage = parseFloat(data.grossWeightPercentage)
    const lbrFloat = parseFloat(data.lbr);
    const amountInt = parseFloat(data.amount);

    

    
    invoice_details.makingChargesPercentage = data.makingChargesPercentage


    let withoutGst,amount,cgstAmount,sgstAmount,igstAmount, makingChargesAmount;
    

    if(data.igst){
        const igstFloat = parseFloat(data.igst);
        withoutGst = (amountInt*(100/(100 + igstFloat)));
        makingChargesAmount = ((withoutGst/100)*makingChargesPercentage);
        amount = withoutGst-makingChargesAmount;
        igstAmount = (((withoutGst)/100)*igstFloat);
        
    }
    else if(!data.cgst || !data.sgst && !data.igst){
        req.flash('reversegst_error', '* Please enter both SGST and CGST (or) IGST');
        req.flash('description', data.itemDescription );
        req.flash('grossWeight', data.grossWeightPercentage);
        req.flash('netWeight', data.makingChargesPercentage);
        req.flash('lbr', data.lbr);
        req.flash('amount', data.amount);
        return res.redirect('/reversegst');
    }
    else{

        const cgstFloat = parseFloat(data.cgst);
        const sgstFloat = parseFloat(data.sgst);
        const added = cgstFloat+sgstFloat;
        withoutGst = (amountInt*(100/(100 + added)));
        makingChargesAmount = ((withoutGst/100)*makingChargesPercentage);
        amount = withoutGst-makingChargesAmount;
        cgstAmount = (((withoutGst)/100)*cgstFloat);
        sgstAmount = (((withoutGst)/100)*sgstFloat);
        
    }
    const netWeight = (amount/lbrFloat);
    invoice_details.netWeight = netWeight;

    invoice_details.grossWeight = netWeight+ ((netWeight/100)*grossWeightPercentage);

    invoice_details.subTotal = "Rs."+ (withoutGst).toLocaleString('en-IN',{maximumFractionDigits: 2});
    invoice_details.amount = "Rs."+ (amount).toLocaleString('en-IN',{maximumFractionDigits: 2});

    invoice_details.makingChargesAmount = makingChargesAmount;
    invoice_details.amountInWords = toWords.convert(amountInt).toUpperCase();

    invoice_details.igstAmount = igstAmount;
    invoice_details.cgstAmount = cgstAmount;
    invoice_details.sgstAmount = sgstAmount;

    var temp = await Bill.find({}).sort({_id: -1}).limit(1).exec();
    
    invoice_details.invoiceNo =  temp[0].invoiceNo+1;

    invoice_details.invoiceDate = invoiceDate;
    invoice_details.invoiceTime = invoiceTime;



    
    

    pdfService.buildPDF(invoice_details,__dirname+"/template_editable.pdf","modified-form.pdf").then(()=>{
    
        let invoice = 'MJ'+ date.getFullYear() +invoice_details.invoiceNo
        startDownload.start(req, res, invoice);

    }).then(()=>{
            // saving bill in database

    const bill = new Bill({
        customer_name: invoice_details.customer_name,
        customer_address: invoice_details.customer_address,
        customer_gstin: invoice_details.customer_gstin,
        itemDescription: invoice_details.itemDescription,
        lbr: invoice_details.lbr,
        cgst: invoice_details.cgst,
        igst: invoice_details.igst,
        sgst: invoice_details.sgst,
        grossWeight: invoice_details.grossWeight,
        netWeight: invoice_details.netWeight,
        amount: invoice_details.amount,
        subTotal: invoice_details.subTotal,
        total: invoice_details.total,
        amountInWords: invoice_details.amountInWords,
        invoiceNo: invoice_details.invoiceNo,
        invoiceDate: invoice_details.invoiceDate,
        invoiceTime: invoice_details.invoiceTime,
        igstAmount: invoice_details.igstAmount,
        cgstAmount: invoice_details.cgstAmount,
        sgstAmount: invoice_details.sgstAmount,
        invoiceYear: singleYear,
        makingChargesPercentage: invoice_details.makingChargesPercentage,
        makingChargesAmount: invoice_details.makingChargesAmount,
        hsn: invoice_details.hsn
        });
    bill.save((err)=>{
        if(err){
            res.send(err)
        }
        
        });
    });
    

});

app.post("/delete", (req, res)=>{
    
    Bill.findByIdAndRemove(req.body.deleteBill, (err)=>{
        if(!err){
            console.log('Bill successfully deleted');
            res.redirect('/history');
        }
    })

})

app.post("/delete-query", (req, res)=>{
    
    Query.findByIdAndRemove(req.body.delete_query, (err)=>{
        if(!err){
            console.log('query successfully deleted');
            res.redirect('/queries');
        }
    })

})



app.post("/query", (req, res)=>{

    const query = new Query({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        message: req.body.message
    })

    query.save((err)=>{
        if(err){
            res.send("Something went wrong, Please try again")
        }
        else{
            req.flash("sent_success", "Thank you for contacting us, we will get in touch with you soon!")
            return res.redirect("/contact")
        }
    })
})

app.post("/logout", (req, res)=>{
    req.logout(()=>{
        return res.redirect('/')
    });
})

app.post("/invoice-copy", (req, res)=>{

    Bill.find({_id: req.body.invoiceNo}, (err, result)=>{
        
        if(err){
            res.send(err);
        }
        pdfService.buildPDF(result[0],__dirname+"/template_editable.pdf","modified-form.pdf").then(()=>{

            var invoiceCopyNo = 'MJ'+result[0].invoiceYear+result[0].invoiceNo
            startDownload.start(req, res, invoiceCopyNo);
        })
    })
})

// app.post("/invoice", (req, res)=>{
//     console.log(req.body.bill);
//     invoice = req.body.bill;
//     res.redirect("/invoice")
// })

app.use((req, res)=>{
    res.status(404).send('<h1>404, Page not found</h1>');
})

/********************************************* */





















app.listen(PORT, ()=>{

    console.log(`Server started at port: ${PORT}`);

})