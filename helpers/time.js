module.exports = function prettyDate2() {
  const date = new Date();
  return date.toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
  //   return date.toLocaleTimeString(navigator.language, {
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   });
};
