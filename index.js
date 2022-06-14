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


//const process2 = spawn('python', ['./parsingSOVID_forecasts.py']);
//process2.stdout.on('data', (data) => {
//  console.log("parsing is over")
//  console.log(data.toString());
//})

//удаление ненужных файлов
console.log(moment().subtract(0, 'days').format('D.M.YYYY'));
function intervalDelFunc() {
  var data_to_delete = moment().subtract(2, 'days').format('M.D.YYYY')
  console.log(data_to_delete)
  var filter = fileMatch('*_'+data_to_delete+'.json');
  const testFolder = '/root/server/server.app.covid19-modeling';

  fs.readdir(testFolder, (err, files) => {
    files.forEach(file => {
        //console.log(file)
      if (filter(file)) {
        console.log("нашли файл для удаления")
        fs.unlink(file, err => {
           if(err) throw err; // не удалось удалить файл
           console.log('Файл успешно удалён');
        })
      } else {
        console.log('Файл не найден');
      }
    });
  })
}

setInterval(intervalDelFunc, 86400);
////

app.get("/deleteCurFiles", (req, res) => {
  console.log("work")
})

app.get("/getMsim", (req, res) => {
  fs.readFile('./msim_res.json', 'utf8', async (error, data) => {
    if (error) {
      return console.log('error reading file');
    }
    let data2 = JSON.parse(data);
    res.send(data2)
})
})

app.post("/getUMsim2", urlencodedParser, (req, res) => {
  var now_data = moment().subtract(0, 'days').format('M.D.YYYY')
  console.log('./users_msim_res_'+req.body.region_data+'_'+req.body.population_data+'_'+ req.body.init_inf+'_'+req.body.n_future_day+'_'+now_data+'.json')
  fs.readFile('./users_msim_res_'+req.body.region_data+'_'+req.body.population_data+'_'+ req.body.init_inf+'_'+req.body.n_future_day+'_'+now_data+'.json', 'utf8', async (error, data) => {
    if (error) {
      return console.log('error reading file');
    }
    let data2 = JSON.parse(data);
    res.send(data2)
  })
})

app.post("/data", urlencodedParser, (req, res) => {
  console.log(req.body)
  run_model(req.body.population_data, req.body.region_data, req.body.n_future_day, req.body.init_inf, req, res)
})

function run_model(tt, region_num, n_future, init_inf, req, res){
  if(region_num==1){
    fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/novosibirsk-region-data.csv', 'utf8', async (error, data) => {
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
  } else if(region_num==2){
    fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/omsk-region-data.csv', 'utf8', async (error, data) => {
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
    fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/altay-region-data.csv', 'utf8', async (error, data) => {
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
  //  var now_data = new Date().toLocaleDateString();
    var now_data = moment().subtract(0, 'days').format('M.D.YYYY')
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

app.post("/api/curData", urlencodedParser, (req, res) => {
  console.log('./curData'+req.body.region_data+'.json')
  fs.readFile('./curData'+req.body.region_data+'.json', 'utf8', async (error, data) => {
    if (error) {
      return console.log('error reading file');
    }
    res.send(data)
  });
});

app.post("/api/CovidStaticFiles", urlencodedParser, (req, res)=>{
  console.log("/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/" + req.body.region_name + "-region-data.csv");
  res.download("/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/" + req.body.region_name + "-region-data.csv")
});

app.get("/article", (req, res)=>{
  res.download("./modeling_article.pdf")
});

app.get("/api/CovidStaticFilesAntibodies", urlencodedParser,(req, res)=>{
  var data = await fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/novosibirsk-invitro.csv', 'utf8')
  res.download(data)
});

app.get("/api/csvCovid", (req, res) => {
  var data = fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/novosibirsk-region-data.csv', 'utf8')
  res.send(data)
});

app.set('view engine', 'ejs');

app.get("/api/csvCovid/new_diagnoses", (req, res) => {
  fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/novosibirsk-region-data.csv', 'utf8', async (error, data) => {
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
  fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/novosibirsk-region-data.csv', 'utf8', async (error, data) => {
    if (error) {
      return console.log('error reading file');
    }
    const parsedData = await neatCsv(data);
    let data2 = JSON.stringify(parsedData);
    res.send(data2)
  });
});

app.get("/api/csvCovid/altay", (req, res) => {
  fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/altay-region-data.csv', 'utf8', async (error, data) => {
    if (error) {
      return console.log('error reading file');
    }
    const parsedData = await neatCsv(data);
    let data2 = JSON.stringify(parsedData);
    res.send(data2)
  });
});

app.get("/api/csvCovid/omsk", (req, res) => {
  fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/data/omsk-region-data.csv', 'utf8', async (error, data) => {
    if (error) {
      return console.log('error reading file');
    }
    const parsedData = await neatCsv(data);
    let data2 = JSON.stringify(parsedData);
    res.send(data2)
  });
});

app.get("/api/res_valid", (req, res) => {
  fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/SEIR_HCD/res_valid.csv', 'utf8', async (error, data) => {
    if (error) {
      return console.log('error reading file!');
    }
    const parsedData = await neatCsv(data);
    let data2 = JSON.stringify(parsedData);
    res.send(data2)
  });
});

app.get("/api/res_train", (req, res) => {
  fs.readFile('/root/data/data.app.covid19-modeling/covid19-modeling.ru/SEIR_HCD/res_train.csv', 'utf8', async (error, data) => {
    if (error) {
      return console.log('error reading file!');
    }
    const parsedData = await neatCsv(data);
    let data2 = JSON.stringify(parsedData);
    //console.log(data2)
    res.send(data2)
  });
});

app.post("/api/forecasts", urlencodedParser,(req, res) => {
  fs.readFile('./parsingSOVID_files/' + req.body.datatype + '_res_mod_pred.csv', 'utf8', async (error, data) => {
    if (error) {
      return console.log('error reading file!');
    }
    const parsedData = await neatCsv(data);
    let data2 = JSON.stringify(parsedData);
    //console.log(data2)
    res.send(data2)
  });
});

app.post("/api/forecasts_true", urlencodedParser, (req, res) => {
  console.log(req.body.datatype)
  fs.readFile('./parsingSOVID_files/' + req.body.datatype + '_res_mod_true.csv', 'utf8', async (error, data) => {
    if (error) {
      return console.log('error reading file!');
    }
    const parsedData = await neatCsv(data);
    let data2 = JSON.stringify(parsedData);
    //console.log(data2)
    res.send(data2)
  });
});

app.post("/api/forecasts_train", urlencodedParser, (req, res) => {
  console.log('./parsingSOVID_files/' + req.body.dataT + '_res_mod_train.csv')
  fs.readFile('./parsingSOVID_files/' + req.body.dataT + '_res_mod_train.csv', 'utf8', async (error, data) => {
    if (error) {
      return console.log('error reading file');
    }
    const parsedData = await neatCsv(data);
    let data2 = JSON.stringify(parsedData);
    //console.log(data2)
    res.send(data2)
  });
});


app.listen(process.env.PORT || 4000); // .listen запускает наш web сервер, если добавить колбэк вторым параметров, то можно задать какой-то функционал после старта сервера
