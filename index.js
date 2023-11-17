require("dotenv").config();
const fastify = require("fastify")({ logger: false, trustProxy: true });
const path = require("path");
if (!process.env.NOCODB_URL) {
  throw new Error("NOCODB_URL is not defined");
}
if (!process.env.NOCODB_TOKEN) {
  throw new Error("NOCODB_TOKEN is not defined");
}
fastify.register(require("@fastify/cors"));
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "static"),
});

fastify.get("/", function (req, reply) {
  return reply.sendFile("index.html");
});
fastify.get("/coolify/v4/alive", async function (req, reply) {
  const appId = req.query.appId;
  if (!appId || appId === "") {
    return 'OK';
  }
  const baseUrl = process.env.NOCODB_URL;
  const nocodbUrl = baseUrl + "/api/v1/db/data/noco/p8ovlkfbtnecctq/v4InstanceCounter"
  const found = await fetch(nocodbUrl + "/find-one?where=where%28Uuid%2Ceq%2C" + appId + "%29", {
    headers: {
      'xc-token': process.env.NOCODB_TOKEN
    }
  })
  const json = await found.json();
  if (json && json?.Id) {
    const payload = JSON.stringify({
      LastSeen: new Date().getTime()
    });
    fetch(nocodbUrl + '/' + json.Id, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'xc-token': process.env.NOCODB_TOKEN
      },
      body: payload
    });
  } else {
    const payload = JSON.stringify({
      Uuid: appId,
      LastSeen: new Date().getTime()
    });
    fetch(nocodbUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'xc-token': process.env.NOCODB_TOKEN
      },
      body: payload
    });
  }
  return 'OK';

});
fastify.get("/versions.json", async function (req, reply) {
  const appId = req.query.appId;
  const version = req.query.version || '0.0.0';
  const baseUrl = process.env.NOCODB_URL;
  const nocodbUrl = baseUrl + "/api/v1/db/data/noco/p8ovlkfbtnecctq/InstanceCounter"
  const found = await fetch(nocodbUrl + "/find-one?where=where%28Uuid%2Ceq%2C" + appId + "%29", {
    headers: {
      'xc-token': process.env.NOCODB_TOKEN
    }
  })
  const json = await found.json();
  if (json && json?.Id) {
    const payload = JSON.stringify({
      LastSeen: new Date().getTime(),
      Version: version
    });
    fetch(nocodbUrl + '/' + json.Id, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'xc-token': process.env.NOCODB_TOKEN
      },
      body: payload
    });
  } else {
    const payload = JSON.stringify({
      Uuid: appId,
      LastSeen: new Date().getTime(),
      Version: version
    });
    fetch(nocodbUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'xc-token': process.env.NOCODB_TOKEN
      },
      body: payload
    });
  }
  return reply.sendFile("versions.json");
});
fastify.get("/coolify/v4/instances", async function (req, reply) {
  if (req.headers["cool-api-key"] !== process.env.API_KEY) {
    return reply.redirect("https://coollabs.io");
  }
  const baseUrl = process.env.NOCODB_URL;
  const nocodbUrl = baseUrl + "/api/v1/db/data/noco/p8ovlkfbtnecctq/v4InstanceCounter"
  const instances = await fetch(nocodbUrl + "/count", {
    headers: {
      'xc-token': process.env.NOCODB_TOKEN
    }
  });
  const json = await instances.json();
  return { count: json.count };
});
fastify.get("/instances", async function (req, reply) {
  if (req.headers["cool-api-key"] !== process.env.API_KEY) {
    return reply.redirect("https://coollabs.io");
  }
  const baseUrl = process.env.NOCODB_URL;
  const nocodbUrl = baseUrl + "/api/v1/db/data/noco/p8ovlkfbtnecctq/InstanceCounter"
  const instances = await fetch(nocodbUrl + "/count", {
    headers: {
      'xc-token': process.env.NOCODB_TOKEN
    }
  });
  const nocodbUrlv4 = baseUrl + "/api/v1/db/data/noco/p8ovlkfbtnecctq/v4InstanceCounter"
  const instancesv4 = await fetch(nocodbUrlv4 + "/count", {
    headers: {
      'xc-token': process.env.NOCODB_TOKEN
    }
  });
  const json = await instances.json();
  const jsonv4 = await instancesv4.json();

  return { count: json.count + jsonv4.count };
});
// fastify.get("/instances/seen", async function (req, reply) {
//   if (req.headers["cool-api-key"] !== process.env.API_KEY) {
//     return reply.redirect("https://coollabs.io");
//   }
//   const instances = await redis.keys("*");
//   const lastSeen = [];
//   for (const instance of instances) {
//     lastSeen.push({ seen: new Date(Number(await redis.get(instance))) });
//   }
//   return { lastSeen };
// });

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log(`API listening on ${fastify.server.address().port}.`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
