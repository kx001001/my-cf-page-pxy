export default {
  async fetch(request, env) {
    // 1. 解析传入请求的URL，方便后续操作
    let url = new URL(request.url);
    // 2. 从环境变量中获取目标协议，如果未设置则使用默认的https协议
    let targetProtocol = env.PROTOCOL || "https";
    // 3. 从环境变量中获取目标端口，如果未设置则使用默认的443端口
    let targetPort = env.PORT || "443";

    if (url.pathname.startsWith('/')) {
      // 4. 如果请求路径是以'/'开头，进行后续相关处理

      // 5. 设置目标主机名，从环境变量中获取，如果未设置则使用默认的example.com
      url.hostname = env.HOSTNAME || "example.com";
      // 6. 设置请求的协议部分，使用之前获取到的目标协议并添加':'
      url.protocol = targetProtocol + ":";
      // 7. 设置请求的端口部分，使用之前获取到的目标端口
      url.port = targetPort;

      if (request.headers.get('Upgrade') === 'websocket') {
        // 8. 如果请求头中的'Upgrade'字段为'websocket'，表明这是一个WebSocket请求，进行特殊处理

        // 9. 创建一个WebSocketPair，用于模拟本地WebSocket连接的两端（客户端和服务器端）
        const webSocketPair = new WebSocketPair();
        // 10. 获取WebSocketPair中的客户端套接字，后续用于和本地客户端交互
        const clientSocket = webSocketPair[0];
        // 11. 获取WebSocketPair中的服务器套接字，后续用于和目标服务器交互
        const serverSocket = webSocketPair[1];

        // 12. 基于处理后的目标URL以及原始请求信息构建一个新的Request对象
        const new_request = new Request(url, request);
        // 13. 设置新请求的'Connection'头信息为'Upgrade'，符合WebSocket协议要求
        new_request.headers.set('Connection', 'Upgrade');
        // 14. 设置新请求的'Upgrade'头信息为'websocket'，明确是WebSocket升级请求
        new_request.headers.set('Upgrade', 'websocket');

        try {
          // 15. 发起fetch请求去连接目标WebSocket服务器，并等待响应
          const webSocketResponse = await fetch(new_request);
          if (webSocketResponse.body) {
            // 16. 如果获取到的响应有body（意味着有数据可传递），进行以下操作

            // 17. 将远程WebSocket响应的流通过pipeTo方法连接到本地的WebSocket客户端套接字上，
            // 这样客户端就能接收到服务器最初返回的数据了
            webSocketResponse.body.pipeTo(clientSocket.writable);

            // 18. 新增：添加对客户端发送数据的监听，以便转发给服务器
            clientSocket.addEventListener('message', (event) => {
              // 19. 获取客户端通过WebSocket发送过来的数据
              const dataToSend = event.data;
              // 20. 根据数据类型进行相应处理，这里简单示例文本和二进制数据的转发逻辑
              if (typeof dataToSend === 'string') {
                // 21. 如果是文本数据，通过服务器套接字将数据发送给服务器
                serverSocket.send(dataToSend);
              } else if (dataToSend instanceof ArrayBuffer) {
                // 22. 如果是二进制数据，同样通过服务器套接字将数据发送给服务器
                serverSocket.send(dataToSend);
              }
            });

            // 23. 新增：添加对服务器返回数据的监听，以便转发给客户端
            serverSocket.addEventListener('message', (event) => {
              // 24. 获取服务器通过WebSocket发送过来的数据（即对客户端数据的响应数据）
              const dataToSendToClient = event.data;
              // 25. 根据数据类型进行相应处理，这里简单示例文本和二进制数据的转发逻辑
              if (typeof dataToSendToClient === 'string') {
                // 26. 如果是文本数据，通过客户端套接字将数据发送给客户端
                clientSocket.send(dataToSendToClient);
              } else if (dataToSendToClient instanceof ArrayBuffer) {
                // 27. 如果是二进制数据，同样通过客户端套接字将数据发送给客户端
                clientSocket.send(dataToSendToClient);
              }
            });

            // 28. 新增：添加对WebSocket连接关闭等事件的监听，以便进行相应清理操作
            clientSocket.addEventListener('close', () => {
              // 29. 当客户端WebSocket连接关闭时，关闭服务器套接字，避免资源浪费及异常情况
              serverSocket.close();
            });
            serverSocket.addEventListener('close', () => {
              // 30. 当服务器端WebSocket连接关闭时，关闭客户端套接字，保证两端连接状态同步及资源合理释放
              clientSocket.close();
            });

            // 31. 返回一个状态码为101（表示协议切换）的响应，告知客户端协议切换到WebSocket协议了，
            // 且设置了相应的'Upgrade'和'Connection'响应头
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
          // 32. 如果在尝试连接或处理过程中出现错误，在控制台打印错误信息
          console.error("WebSocket request error:", error);
          // 33. 关闭客户端套接字
          clientSocket.close();
          // 34. 返回一个状态码为500的响应表示WebSocket连接失败
          return new Response("WebSocket connection failed", { status: 500 });
        }
      } else {
        // 35. 如果请求不是WebSocket请求（即不满足'Upgrade'为'websocket'的条件），
        // 则只是简单地基于处理后的URL构建一个新的Request对象，并将其转发
        let new_request = new Request(url, request);
        return fetch(new_request);
      }
    }
    // 36. 如果请求的路径不是以'/'开头（即不在前面针对'/'开头路径的处理分支内），
    // 代码假设这是请求静态资源的情况，会通过env.ASSETS.fetch(request)去尝试获取并返回相应的静态资源响应
    return env.ASSETS.fetch(request);
  },
};
