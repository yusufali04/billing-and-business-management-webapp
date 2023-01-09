const path = require("path");
const fs = require("fs");

function start(req, res, invoiceNo){

    const filePath = path.resolve(__dirname+"/modified-form.pdf");

    fs.readFile(filePath, (err, file)=>{
    if(err){
        console.log(err);
        return(res.status(500).send("Could not download file"));
    }

    res.setHeader('content-Type', 'application/pdf');
    res.setHeader('content-disposition', `attachment;filename=${invoiceNo}.pdf`);
    res.send(file);

})

}

module.exports = {start};

