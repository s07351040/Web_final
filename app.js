const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const app = express();
const path = require("path");
const mysql = require("mysql");
const bodyParser = require("body-parser");
// const { urlencoded } = require("express");
// const { Console } = require("console");
// const { data } = require("cheerio/lib/api/attributes");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true })); //bodyparser寫法需要更改

//連接資料庫

// const db = mysql.createConnection({
//   user: "root",
//   host: "localhost",
//   password: "password",
//   database: "database_1",
// });

// db.connect((err) => {
//   if (err) console.log(err);
//   db.query("SELECT * FROM members", (err, result) => {
//     if (err) console.log(err);
//     else {
//       console.log("successful");
//       console.log(result);
//     }
//   });
// });

//註冊帳號
app.post("/enroll", (req, res) => {
  let { username, password } = req.body;

  let pass = "true";
  //確認無帳密一樣
  let confirm_sql = "SELECT * FROM members WHERE username = ?";

  db.query(confirm_sql, [username], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      // console.log(result);
      let data_result = result; //同樣username的資料
      data_result.forEach((e) => {
        if (e.password === password) {
          pass = "false";
        }
      });
    }

    if (pass === "false") {
      res.send("enroll unsuccessful");
      console.log("INSERT UNSUCCESSFUL, PLASE CHANGE YOUR PASSWORD");
    } else {
      let sql = `INSERT INTO members(username , password) VALUES ('${username}', '${password}')`;
      db.query(sql, (err, result) => {
        if (err) {
          console.log(err);
        } else {
          console.log("INSERT SUCCESSFUL");
          res.send("REGISTER SUCCESSFUL");
        }
      });
    }
  });
});

//當日匯率
async function getpage() {
  const res = await axios.get("https://rate.bot.com.tw/xrt?Lang=zh-TW"); //透過axios發http request
  const $ = cheerio.load(res.data); //將data存入$
  const elementselector = `.table > tbody:nth-child(2) > tr`; //選擇器

  const keys = ["cash_buy", "cash_sell", "deposit_buy", "deposit_sell"];
  const rateobj = []; //匯率總資料

  $(elementselector).each((parentidx, parentelem) => {
    //tr
    let keyidx = 0;
    let rateobj_temp = {}; //放入每行的匯率資料

    $(parentelem) //tr
      .children()
      .each((childrenidx, childrenelem) => {
        const tdvalue = $(childrenelem).text(); //每行td的text值

        if (childrenidx >= 1 && childrenidx <= 4) {
          //取td[1] -> td[4] 的值
          rateobj_temp[keys[keyidx]] = tdvalue.trim(); //tdvlue中的空白及換行字元
          keyidx++;
        }
      });

    rateobj.push(rateobj_temp); //push到總資料
  });
  // console.log(rateobj);

  return rateobj;
}

//歷史匯率
async function gethistorypage(year, month, date) {
  const res = await axios.get(
    `https://rate.bot.com.tw/xrt/all/${year}-${month}-${date}`
  ); //透過axios發http request
  const $ = cheerio.load(res.data); //將data存入$
  const elementselector = `.table > tbody:nth-child(2) > tr`; //選擇器

  const keys = ["cash_buy", "cash_sell", "deposit_buy", "deposit_sell"];
  const rateobj = []; //匯率總資料

  $(elementselector).each((parentidx, parentelem) => {
    //tr
    let keyidx = 0;
    let rateobj_temp = {}; //放入每行的匯率資料

    $(parentelem) //tr
      .children()
      .each((childrenidx, childrenelem) => {
        const tdvalue = $(childrenelem).text(); //每行td的text值

        if (childrenidx >= 1 && childrenidx <= 4) {
          //取td[1] -> td[4] 的值
          rateobj_temp[keys[keyidx]] = tdvalue.trim(); //tdvlue中的空白及換行字元
          keyidx++;
        }
      });

    rateobj.push(rateobj_temp); //push到總資料
  });
  // console.log(rateobj);

  return rateobj;
}
// app.get("/getrate", async (req, res) => {
//   try {
//     const getratevalue = await getpage();
//     // console.log(getratevalue);
//     return res.status(200).json({
//       result: getratevalue,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       err: err.tostring(),
//     });
//   }
// });

app.get("/homepage", async (req, res) => {
  try {
    //當日匯率資料
    const getvalue = await getpage();
    const targetvalue = getvalue[0];

    // 歷史匯率前一日資料
    let today = new Date();

    today.setDate(today.getDate() - 1);

    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    let date = today.getDate();

    if (month < 10) {
      month = `0${month}`;
    }

    if (date < 10) {
      date = `0${date}`;
    }
    // console.log(year, month, date);
    const get_history_value = await gethistorypage(year, month, date);
    const target_history_value = get_history_value[0]; //前一日data

    //取圖表日期 哪5天有資料可抓取

    const time_keys = ["year", "month", "date"];
    let count = 0; //計算已有幾個值
    let time_data = []; //5天時間
    let history_data = [];

    //重新定義值
    year = today.getFullYear();
    month = today.getMonth() + 1;
    date = today.getDate();

    //抓五筆時間資料
    while (count != 5) {
      if (month < 10) {
        month = `0${month}`;
      }

      if (date < 10) {
        date = `0${date}`;
      }
      let history_data_temp = await gethistorypage(year, month, date);
      // console.log(history_data.length);
      let time_data_temp = {}; //暫時資料
      if (history_data_temp.length < 5) {
      } else {
        time_data_temp[time_keys[0]] = `${year}`;
        time_data_temp[time_keys[1]] = `${month}`;
        time_data_temp[time_keys[2]] = `${date}`;
        time_data.push(time_data_temp);
        history_data.push(history_data_temp[0]);
        count++;
      }

      // //重新定義新值
      today.setDate(today.getDate() - 1);
      year = today.getFullYear();
      month = today.getMonth() + 1;
      date = today.getDate();
    }

    // console.log(time_data);

    //相減, 將值放入subtract_result裡面
    const keys = ["cash_buy", "cash_sell", "deposit_buy", "deposit_sell"];

    var subtract_result = []; //結果資料
    for (let i = 0; i < 1; i++) {
      let subtract_result_temp = {};
      subtract_result_temp[keys[0]] =
        Math.floor(
          (targetvalue.cash_buy - target_history_value.cash_buy) * 1000
        ) / 1000;
      subtract_result_temp[keys[1]] =
        Math.floor(
          (targetvalue.cash_sell - target_history_value.cash_sell) * 1000
        ) / 1000;
      subtract_result_temp[keys[2]] =
        Math.floor(
          (targetvalue.deposit_buy - target_history_value.deposit_buy) * 1000
        ) / 1000;
      subtract_result_temp[keys[3]] =
        Math.floor(
          (targetvalue.deposit_sell - target_history_value.deposit_sell) * 1000
        ) / 1000;

      subtract_result.push(subtract_result_temp);
    }
    var subtract_result = subtract_result[0]; //!!!!!重新宣告subtract_result(請不要常用)

    res.render("index.ejs", {
      targetvalue,
      subtract_result,
      time_data,
      history_data,
    });
    // console.log(subtract_result);
  } catch (err) {
    res.send(err);
  }
});

app.get("/currencyhandling", async (req, res) => {
  const getvalue = await getpage(); //將get到的資料存到getvalue
  let { currency } = req.query; //提取query裡的值
  let number = parseInt(currency); //將字串改成整數
  const targetvalue = getvalue[number];

  // 歷史匯率前一日資料
  let today = new Date();

  today.setDate(today.getDate() - 1);

  let year = today.getFullYear();
  let month = today.getMonth() + 1;
  let date = today.getDate();

  if (month < 10) {
    month = `0${month}`;
  }

  if (date < 10) {
    date = `0${date}`;
  }
  // console.log(year, month, date);
  const get_history_value = await gethistorypage(year, month, date);
  const target_history_value = get_history_value[number];
  // console.log(target_history_value);
  //取圖表日期 哪5天有資料可抓取

  const time_keys = ["year", "month", "date"];
  let count = 0; //計算已有幾個值
  let time_data = []; //5天時間
  let history_data = [];

  //重新定義值
  year = today.getFullYear();
  month = today.getMonth() + 1;
  date = today.getDate();

  //抓五筆時間資料
  while (count != 5) {
    if (month < 10) {
      month = `0${month}`;
    }

    if (date < 10) {
      date = `0${date}`;
    }
    let history_data_temp = await gethistorypage(year, month, date);
    // console.log(history_data.length);
    let time_data_temp = {}; //暫時資料
    if (history_data_temp.length < 5) {
    } else {
      time_data_temp[time_keys[0]] = `${year}`;
      time_data_temp[time_keys[1]] = `${month}`;
      time_data_temp[time_keys[2]] = `${date}`;
      time_data.push(time_data_temp);
      history_data.push(history_data_temp[number]);
      count++;
    }

    // //重新定義新值
    today.setDate(today.getDate() - 1);
    year = today.getFullYear();
    month = today.getMonth() + 1;
    date = today.getDate();
  }

  // console.log(time_data);

  //相減, 將值放入subtract_result裡面
  const keys = ["cash_buy", "cash_sell", "deposit_buy", "deposit_sell"];

  var subtract_result = [];
  for (let i = 0; i < 1; i++) {
    let subtract_result_temp = {};
    subtract_result_temp[keys[0]] =
      Math.floor(
        (targetvalue.cash_buy - target_history_value.cash_buy) * 1000
      ) / 1000;
    subtract_result_temp[keys[1]] =
      Math.floor(
        (targetvalue.cash_sell - target_history_value.cash_sell) * 1000
      ) / 1000;
    subtract_result_temp[keys[2]] =
      Math.floor(
        (targetvalue.deposit_buy - target_history_value.deposit_buy) * 1000
      ) / 1000;
    subtract_result_temp[keys[3]] =
      Math.floor(
        (targetvalue.deposit_sell - target_history_value.deposit_sell) * 1000
      ) / 1000;

    subtract_result.push(subtract_result_temp);
  }
  var subtract_result = subtract_result[0]; //!!!!!重新宣告subtract_result(請不要常用)
  const selected_number = {
    number: number,
  };
  // console.log(selected_number);
  res.render("index2.ejs", {
    targetvalue,
    subtract_result,
    selected_number,
    time_data,
    history_data,
  });
  // console.log(subtract_result);
});

//預設值
app.get("/currency_exchange", async (req, res) => {
  const getvalue = await getpage();
  const keys = ["cash_buy", "cash_sell", "deposit_buy", "deposit_sell"];
  const USDvalue = getvalue[0]; //美金為預設值
  const exchange_value = [];

  getvalue.forEach((e, idx) => {
    let exchange_value_temp = {};
    exchange_value_temp[keys[0]] =
      Math.floor((USDvalue.cash_buy / e.cash_buy) * 1000) / 1000;
    exchange_value_temp[keys[1]] =
      Math.floor((USDvalue.cash_sell / e.cash_sell) * 1000) / 1000;
    exchange_value_temp[keys[2]] =
      Math.floor((USDvalue.deposit_buy / e.deposit_buy) * 1000) / 1000;
    exchange_value_temp[keys[3]] =
      Math.floor((USDvalue.deposit_sell / e.deposit_sell) * 1000) / 1000;

    exchange_value.push(exchange_value_temp);
  });

  //美金換臺幣
  let TWDvalue = {};
  TWDvalue[keys[0]] = Math.floor(USDvalue.cash_buy * 1000) / 1000;
  TWDvalue[keys[1]] = Math.floor(USDvalue.cash_sell * 1000) / 1000;
  TWDvalue[keys[2]] = Math.floor(USDvalue.deposit_buy * 1000) / 1000;
  TWDvalue[keys[3]] = Math.floor(USDvalue.deposit_sell * 1000) / 1000;

  exchange_value.push(TWDvalue);

  res.render("currency_exchange.ejs", { exchange_value });
});

app.get("/exchange_execute", async (req, res) => {
  let { currency, type, money } = req.query; //取得表單資料

  const getvalue = await getpage();
  const keys = ["cash_buy", "cash_sell", "deposit_buy", "deposit_sell"];
  const targetvalue = getvalue[currency]; //美金為預設值
  const exchange_value = [];

  getvalue.forEach((e, idx) => {
    let exchange_value_temp = {};
    exchange_value_temp[keys[0]] =
      Math.floor((targetvalue.cash_buy / e.cash_buy) * money * 1000) / 1000;
    exchange_value_temp[keys[1]] =
      Math.floor((targetvalue.cash_sell / e.cash_sell) * money * 1000) / 1000;
    exchange_value_temp[keys[2]] =
      Math.floor((targetvalue.deposit_buy / e.deposit_buy) * money * 1000) /
      1000;
    exchange_value_temp[keys[3]] =
      Math.floor((targetvalue.deposit_sell / e.deposit_sell) * money * 1000) /
      1000;

    exchange_value.push(exchange_value_temp);
  });

  //美金換臺幣
  let TWDvalue = {};
  TWDvalue[keys[0]] = Math.floor(targetvalue.cash_buy * money * 1000) / 1000;
  TWDvalue[keys[1]] = Math.floor(targetvalue.cash_sell * money * 1000) / 1000;
  TWDvalue[keys[2]] = Math.floor(targetvalue.deposit_buy * money * 1000) / 1000;
  TWDvalue[keys[3]] =
    Math.floor(targetvalue.deposit_sell * money * 1000) / 1000;

  exchange_value.push(TWDvalue);

  res.render("currency_exchange2.ejs", {
    exchange_value,
    currency,
    type,
    money,
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
