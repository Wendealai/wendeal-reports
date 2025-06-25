const http = require("http");

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/",
  method: "GET",
  timeout: 5000,
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);

  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("服务器响应正常！");
    console.log(`响应长度: ${data.length} 字符`);
  });
});

req.on("error", (err) => {
  console.log(`请求错误: ${err.message}`);
  console.log("开发服务器可能还没有完全启动，或者运行在不同的端口上");
});

req.on("timeout", () => {
  console.log("请求超时");
  req.destroy();
});

req.end();
