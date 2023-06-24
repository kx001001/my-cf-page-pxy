export default {
  async fetch(request, env) {
    let url = new URL(request.url);
    if (url.pathname.startsWith('/')) {
      url.hostname = env.HOSTNAME || "example.com"; // 使用 env 设置的 HOSTNAME，如果不存在则使用 "example.com"
      let new_request = new Request(url, request);
      return fetch(new_request);
    }
    // Otherwise, serve the static assets.
    return env.ASSETS.fetch(request);
  },
};
