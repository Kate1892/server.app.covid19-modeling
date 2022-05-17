const express=require("express")
const cors=require("cors")
const fs = require('fs')
var papaparse = require("papaparse")
const neatCsv = require('neat-csv')
const cluster = require('cluster')
const os = require('os')
const spawn = require('child_process').spawn
var bodyParser = require('body-parser')
const app=express() //инициализация приложения

app.use(cors())

const numCpu = os.cpus().length

var moment = require('moment')
var fileMatch = require('file-match');

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use(bodyParser.json());

//удаление ненужных файлов
console.log(moment().subtract(0, 'days').format('DD/MM/YYYY'));
function intervalDelFunc() {
  var data_to_delete = moment().subtract(2, 'days').format('MM/D/YYYY')
  console.log(data_to_delete)
  var filter = fileMatch('*_'+data_to_delete+'.json');
  const testFolder = './';

  fs.readdir(testFolder, (err, files) => {
    files.forEach(file => {
      if (filter(file)) {
        console.log("нашли файл для удаления")
        fs.unlink(file, err => {
           if(err) throw err; // не удалось удалить файл
           console.log('Файл успешно удалён');
        })
      }
    });
  })
}

//setInterval(intervalDelFunc, 86400);
setInterval(intervalDelFunc, 4000);
////

app.get("/deleteCurFiles", (req, res) => {
  console.log("work")
})

app.get("/getMsim", (req, res) => {
  fs.readFile('./msim_res.json', 'utf8', async (error, data) => {  //чтобы асинхронненько
    if (error) {
      return console.log('error reading file');
    }
    let data2 = JSON.parse(data);
    res.send(data2)
})
})

/*app.get("/getUMsim", (req, res) => { //условное по параметрам чтение файла
  //fs.readFile('./Users_msim_res.json', 'utf8', async (error, data) => {  //чтобы асинхронненько
  var now_data = new Date().toLocaleDateString();
  fs.readFile('./users_msim_res_'+region_num+'_'+tt+'_'+init_inf+'_'+n_future+'_'+now_data+'.json', 'utf8', async (error, data) => {
    console.log('./users_msim_res_'+region_num+'_'+tt+'_'+init_inf+'_'+n_future+'_'+now_data+'.json')
    if (error) {
      return console.log('error reading file');
    }
    let data2 = JSON.parse(data);
    res.send(data2)
  })
})*/

app.post("/getUMsim2", urlencodedParser, (req, res) => { //условное по параметрам чтение файла
    var now_data = new Date().toLocaleDateString();
  console.log('./users_msim_res_'+req.body.region_data+'_'+req.body.population_data+'_'+ req.body.init_inf+'_'+req.body.n_future_day+'_'+now_data+'.json')
  //fs.readFile('./Users_msim_res.json', 'utf8', async (error, data) => {  //чтобы асинхронненько
  fs.readFile('./users_msim_res_'+req.body.region_data+'_'+req.body.population_data+'_'+ req.body.init_inf+'_'+req.body.n_future_day+'_'+now_data+'.json', 'utf8', async (error, data) => {
    if (error) {
      return console.log('error reading file');
    }
    let data2 = JSON.parse(data);
    //console.log(data2)
    res.send(data2)
  })
})

app.get("/api/n", (req, res)=>{
  res.download("/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/novosibirsk-region-data.csv")
});

app.post("/data", urlencodedParser, (req, res) => {
  console.log(req.body)
  run_model(req.body.population_data, req.body.region_data, req.body.n_future_day, req.body.init_inf, req, res)
})

function run_model(tt, region_num, n_future, init_inf, req, res){
  if(region_num==1){
    fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/novosibirsk-region-data.csv', 'utf8', async (error, data) => {  //чтобы асинхронненько
      if (error) {
        return console.log('error reading file');
      }
      const parsedData = await neatCsv(data);
      let data2 = JSON.stringify(parsedData);
      //fs.writeFile('./curData'+region_num +'.json', data2, err => {
      fs.writeFile('./curData'+region_num +'.json', data2, err => {
        if(err) throw err;
        console.log('Файл успешно скопирован');
      })
    })
  } else if(region_num==2){
    fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/omsk-region-data.csv', 'utf8', async (error, data) => {  //чтобы асинхронненько
      if (error) {
        return console.log('error reading file');
      }
      const parsedData = await neatCsv(data);
      let data2 = JSON.stringify(parsedData);
      fs.writeFile('./curData'+region_num +'.json', data2, err => {
        if(err) throw err;
        console.log('Файл успешно скопирован');
      })
    })
  } else if(region_num==3){
    fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/altay-region-data.csv', 'utf8', async (error, data) => {  //чтобы асинхронненько
      if (error) {
        return console.log('error reading file');
      }
      const parsedData = await neatCsv(data);
      let data2 = JSON.stringify(parsedData);
      fs.writeFile('./curData'+region_num +'.json', data2, err => {
        if(err) throw err;
        console.log('Файл успешно скопирован');
      })
    })
  }

  return new Promise((resolve, reject) => {
    console.log(tt)
    console.log(region_num)
    var now_data = new Date().toLocaleDateString();
    console.log(now_data)
    const process = spawn('python3.10', ['./dlya_kati.py', tt, region_num, n_future, init_inf, now_data]);
    process.stdout.on('data', (data) => {
      console.log(data.toString());
    })
    req.connection.on('close',function(){
      process.kill()
    console.log('user cancelled');
    });
    process.on('close', (code) => res.send('ok'));
  });

}

/*app.get("/api/try2", (req, res) => {

  if(region_num==1){
    fs.readFile('./../www/covid19-modeling.ru/data/novosibirsk-region-data.csv', 'utf8', async (error, data) => {  //чтобы асинхронненько
      if (error) {
        return console.log('error reading file');
      }
      const parsedData = await neatCsv(data);
      let data2 = JSON.stringify(parsedData);
      //fs.writeFile('./curData'+region_num +'.json', data2, err => {
      fs.writeFile('./curData'+region_num +'.json', data2, err => {
        if(err) throw err;
        console.log('Файл успешно скопирован');
      })
    })
  } else if(region_num==2){
    fs.readFile('./../www/covid19-modeling.ru/data/omsk-region-data.csv', 'utf8', async (error, data) => {  //чтобы асинхронненько
      if (error) {
        return console.log('error reading file');
      }
      const parsedData = await neatCsv(data);
      let data2 = JSON.stringify(parsedData);
      fs.writeFile('./curData'+region_num +'.json', data2, err => {
        if(err) throw err;
        console.log('Файл успешно скопирован');
      })
    })
  } else if(region_num==3){
    fs.readFile('./../www/covid19-modeling.ru/data/altay-region-data.csv', 'utf8', async (error, data) => {  //чтобы асинхронненько
      if (error) {
        return console.log('error reading file');
      }
      const parsedData = await neatCsv(data);
      let data2 = JSON.stringify(parsedData);
      fs.writeFile('./curData'+region_num +'.json', data2, err => {
        if(err) throw err;
        console.log('Файл успешно скопирован');
      })
    })
  }

  return new Promise((resolve, reject) => {
    console.log(tt)
    console.log(region_num)
    const process = spawn('python', ['./dlya_kati.py', tt, region_num, n_future, init_inf]);
    process.stdout.on('data', (data) => {
      console.log(data.toString());
    })
    req.connection.on('close',function(){
      process.kill()
    console.log('user cancelled');
    });
    process.on('close', (code) => res.send('ok'));
  });
})*/

app.post("/api/curData", urlencodedParser, (req, res) => {
  console.log('./curData'+req.body.region_data+'.json')
  fs.readFile('./curData'+req.body.region_data+'.json', 'utf8', async (error, data) => {  //чтобы асинхронненько
    if (error) {
      return console.log('error reading file');
    }
    res.send(data)
  });
});

app.get("/api/a", (req, res)=>{
  res.download("/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/altay-region-data.csv")
});

app.get("/api/o", (req, res)=>{
  res.download("/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/omsk-region-data.csv")
});

app.get("/article", (req, res)=>{
  res.download("./modeling_article.pdf")
});

app.get("/api/csvCovid", (req, res) => {
  var data = fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/novosibirsk-region-data.csv', 'utf8')
  res.send(data)
});

app.set('view engine', 'ejs');

app.get("/api/csvCovid/new_diagnoses", (req, res) => {
  fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/novosibirsk-region-data.csv', 'utf8', async (error, data) => {  //чтобы асинхронненько
    if (error) {
      return console.log('error reading file');
    }
    const parsedData = await neatCsv(data);

    fs.writeFile("CovidJsonData.json", parsedData)
    var new_diagnoses = []
    var new_diagnosesLength = Object.keys(parsedData).length

    for (var i = 0; i < new_diagnosesLength; i++){
      new_diagnoses.push(parsedData[i]["new_diagnoses"])
    }
    res.send(new_diagnoses)
    console.log("Ok!")
  });
});

app.get("/api/csvCovid/nd", (req, res) => {
  //fs.readFile('./../www/covid19-modeling.ru/data/novosibirsk-region-data.csv', 'utf8', async (error, data) => {  //чтобы асинхронненько
  fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/novosibirsk-region-data-small.csv', 'utf8', async (error, data) => {
    if (error) {
      return console.log('error reading file');
    }
    const parsedData = await neatCsv(data);
    let data2 = JSON.stringify(parsedData);
    res.send(data2)
  });
});

app.get("/api/csvCovid/altay", (req, res) => {
  fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/altay-region-data.csv', 'utf8', async (error, data) => {  //чтобы асинхронненько
    if (error) {
      return console.log('error reading file');
    }
    const parsedData = await neatCsv(data);
    let data2 = JSON.stringify(parsedData);
    res.send(data2)
  });
});

app.get("/api/csvCovid/omsk", (req, res) => {
  fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/omsk-region-data.csv', 'utf8', async (error, data) => {  //чтобы асинхронненько
    if (error) {
      return console.log('error reading file');
    }
    const parsedData = await neatCsv(data);
    let data2 = JSON.stringify(parsedData);
    res.send(data2)
  });
});

app.listen(process.env.PORT || 4000); // .listen запускает наш web сервер, если добавить колбэк вторым параметров, то можно задать какой-то функционал после старта сервера
