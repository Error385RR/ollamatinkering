// const readline = require('readline');
import * as readline from "node:readline/promises";
import * as fs from "node:fs/promises"
import { stdin as input, stdout as output } from 'node:process';


async function postPrompt(model, prompt){
    loadedhistory.push({role: "user", content: prompt})
    const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers:{"Content-Type" : "application/json"},
        body: JSON.stringify({
            model: model,
            messages: loadedhistory,
            stream:false
        })
    })
    const data = await response.json()
    console.log(JSON.stringify(data, null, 2))
    loadedhistory.push({role: "assistant", content: data.message.content})
    return data.message.content
}
function isValidPrompt(prompt){
    return !(prompt.length < 2) 
}
function getHistoryPath(modelName) {
    const safeName = modelName.replace(/[^a-zA-Z0-9_-]/g, "_");
    return `./${safeName}.json`;
}
async function loadHistory(){
    try{
       const data = await fs.readFile(getHistoryPath(choosenmodelname),'utf-8')
       return JSON.parse(data)
    }catch(e){
        if (e.code === 'ENOENT') {
            console.error('Error: config.json file was not found.');
        }
        return [{role:"system", content:"You are a helpful assistant that keeps the answers to the point."}]
    }
}
async function writeHistory(){
    try{
        await fs.writeFile(getHistoryPath(choosenmodelname), JSON.stringify(loadedhistory))
    }catch(e){
        console.error(`Error: ${e}`);
    }
}

const models = await fetch("http://localhost:11434/api/tags").then(res => res.json())
let i = 1;
for(const model of models.models){
    console.log(i +". "+ model.name)
    i++;
}

let choosenmodel
let choosenmodelname
let loadedhistory
const rl = readline.createInterface({input: process.stdin, output: process.stdout})

let running = true

while(running){
    try{ 
        choosenmodel = Number(await rl.question("Choose A Model by typing a Number:"))
        if(choosenmodel <= models.models.length && choosenmodel >= 1 && Number.isInteger(choosenmodel)){
            choosenmodelname = models.models[choosenmodel-1].name
            // console.log(models.models[choosenmodel-1].name)
            running = false
            loadedhistory = await loadHistory()
            while(true){
            try{
                const prompt = await rl.question(`${choosenmodelname}>`)
                if(prompt == "/exit"){
                    console.log("Exiting.....")
                    await writeHistory()
                    break;
                }
                if(!isValidPrompt(prompt)){
                    console.log("Invalid Prompt")
                    continue
                }

                console.log(await postPrompt(choosenmodelname, prompt))
            }
            catch(e){
                console.error("An Error Occured: ", e.message)
                await writeHistory()
                continue
            }    
        }
        }else{console.log("Invalid Selection")}
        
    }
    catch(e){
        console.error("An Error Occured: ", e.message)
        continue
    }   

}



rl.close()

