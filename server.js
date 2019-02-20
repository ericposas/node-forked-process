const http = require('http')
const server = http.createServer()
const {fork} = require('child_process')
const os = require('os')
const moment = require('moment')


server.on('request', (req,res)=>{
  if(req.url === '/'){
    let count=0
    let children = []
    let html = '';
    let timestamp = moment();
    for(let i=0; i<os.cpus().length; i++){
      count++
      let time = Date.now()
      let child = fork('./compute.js')
      child.send('start')
      child.on('message', sum=>{
        children.push({name:`child${i+1}`, value:sum, time:moment.duration(moment().diff(timestamp)).asSeconds()+' seconds'})
        console.log(`child${i+1}: ${sum}`, children)
        if(children.length == 4){
          // we have to wait for all 4 to finish before usind res.end(),
          // which we can only do once, unless we're using ExpressJS
          append_to_dom(children,res)
        }
      })
      console.log(`child/forked process count is ${count}`)
    }
 }
})

function append_to_dom(children,res){
  // html out
  let divs = children.map(child=>`<div id="${child.name}">${child.name} - value calculated: ${child.value} - process time: ${child.time}</div>`)
  let total=0; children.forEach(item=>total+=item.value)
  let div_str = divs.join(',')
  div_str = div_str.replace(/,/g,'')
  let total_div = `<br><div id="total">Total: ${total}</div>`;
  let title = `<div>Long Computation, forked to 4 cpu server side processes</div><br>`;
  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>`;
  let html_close = `</body></html>`;
  res.end(html+title+div_str+total_div+html_close)
  console.log(div_str)
}


server.listen(3000)
console.log('waiting for connection..')
