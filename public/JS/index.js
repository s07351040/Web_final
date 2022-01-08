$("#deposit_rate").on("click", (e) => {
  $(".cash_value").hide();
  $(".deposit_value").show();
  $(".cash_subtract").hide();
  $(".deposit_subtract").show();
});

$("#cash_rate").on("click", (e) => {
  $(".cash_value").show();
  $(".deposit_value").hide();
  $(".cash_subtract").show();
  $(".deposit_subtract").hide();
});

$("#btn_submit").on("click", (e) => {
  $("#btn_submit")
    .children()
    .each((idx) => {
      console.log(idx);
    });
});

// let today = new Date();
// 方法1
// today.setTime(today.getTime() + 2 * 24 * 60 * 60 * 1000);
// let day1 = today.getDate();
// console.log(day1);

//方法2

// const keys = ["month", "day"];
// const date = [];

// for (let i = 7; i >= 1; i--) {
//   let date_temp = {};
//   today.setDate(today.getDate() - 1);
//   date_temp[keys[0]] = today.getMonth() + 1;
//   date_temp[keys[1]] = today.getDate();
//   console.log(today.getDate());
//   date.push(date_temp);
// }

// console.log(date);
