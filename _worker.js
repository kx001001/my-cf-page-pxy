export default {
  async fetch(request, env) {
    let url = new URL(request.url);
    let targetProtocol = env.PROTOCOL || "https";  // 新增，从环境变量获取协议，如果没有设置默认用https
    let targetPort = "443";
    if (targetProtocol === "http") {
        targetPort = env.PORT || "80";  // 如果协议是http，端口默认设置为80或者使用环境变量里设置的端口
    }
    if (url.pathname.startsWith('/')) {
      url.hostname = env.HOSTNAME || "example.com"; // 使用 env 设置的 HOSTNAME，如果不存在则使用 "example.com"
      url.port = env.PORT || "443";
      let new_request = new Request(url, request);
      return fetch(new_request);
    }
    // Otherwise, serve the static assets.
    return env.ASSETS.fetch(request);
  },
};
