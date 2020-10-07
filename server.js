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
doc.useServiceAccountAuth(require("./creds.json"));
const NodeCache = require("node-cache");
var teamCache = new NodeCache();

app.get("/",async (req, res)=>{
    res.render("index.html", {teams: teamCache.get("rows")});
});

async function updateCache(){
    if(process.env.NODE_ENV == "DEV") console.log(new Date()+": Updated Cache");
    let sheet = doc.sheetsByIndex[0];
    let rows = await sheet.getRows({offset:0,limit:20});
    teamCache.set("rows",rows.map(r => {return {name: r.Name, status: r.Status.toLowerCase(), emoji: r.Emoji, desc: r.Description.replace(/\n/g,"<br>")};}));
}

setInterval(updateCache,30000);

(async ()=>{
    await doc.loadInfo();
    await updateCache();
    app.listen(process.env.PORT ?? 8000, () => {
        console.log("Ready");
    });
})();