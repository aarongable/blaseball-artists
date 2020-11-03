const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const { Liquid } = require("liquidjs");
const engine = new Liquid({
    cache: process.env.NODE_ENV === "PROD",
    extname: ".html" 
});

app.engine("html", engine.express()); 
app.set("views", __dirname);
app.set("view engine", "liquid");

app.use(express.static("static"));

const { GoogleSpreadsheet } = require("google-spreadsheet");
const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
doc.useApiKey(process.env.API_KEY);
const NodeCache = require("node-cache");
var artistCache = new NodeCache();

app.get("/",async (req, res)=>{
    res.render("index.html", {artists: artistCache.get("rows")});
});

async function updateCache(){
    if(process.env.NODE_ENV == "DEV") console.log(new Date()+": Updated Cache");
    let sheet = doc.sheetsByIndex[0];
    let rows = await sheet.getRows({offset:0});
    artistCache.set("rows",rows.map(r => {return {name: r.Name, status: r.Status.toLowerCase(), emoji: r.Emoji, link: r.Link, desc: r.Contact?.replace(/\n/g,"<br>")??"Description not set"};}));
}

setInterval(updateCache,30000);

(async ()=>{
    await doc.loadInfo();
    await updateCache();
    let port = process.env.PORT ?? 443;
    app.listen(port, () => {
        console.log("Ready on",port);
    });
})();
