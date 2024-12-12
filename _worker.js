export default {
  async fetch(request, env) {
    let url = new URL(request.url);
    let targetProtocol = env.PROTOCOL || "https";
    let targetPort = env.PORT || "443";
    if (url.pathname.startsWith('/')) {
      url.hostname = env.HOSTNAME || "example.com"; 
      url.protocol = targetProtocol + ":";
      url.port = targetPort;
      if (request.headers.get('Upgrade') === 'websocket') {
        // 对于WebSocket请求进行特殊处理
        const webSocketPair = new WebSocketPair();
        const clientSocket = webSocketPair[0];
        const serverSocket = webSocketPair[1];

        const new_request = new Request(url, request);
        new_request.headers.set('Connection', 'Upgrade');
        new_request.headers.set('Upgrade', 'websocket');

        try {
          const webSocketResponse = await fetch(new_request);
          if (webSocketResponse.body) {
            // 将远程WebSocket响应的流和本地的WebSocket客户端连接起来
            webSocketResponse.body.pipeTo(clientSocket.writable);
            return new Response(null, {
              status: 101,
              statusText: "Switching Protocols",
              headers: {
                "Upgrade": "websocket",
                "Connection": "Upgrade"
              }
            });
          }
        } catch (error) {
          console.error("WebSocket request error:", error);
          clientSocket.close();
          return new Response("WebSocket connection failed", { status: 500 });
        }
      } else {
        let new_request = new Request(url, request);
        return fetch(new_request);
      }
    }
    // Otherwise, serve the static assets.
    return env.ASSETS.fetch(request);
  },
};
