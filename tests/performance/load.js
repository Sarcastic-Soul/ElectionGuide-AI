'use strict';

const autocannon = require('autocannon');
const { createApp } = require('../../src/app');
const config = require('../../src/config');
const redisService = require('../../src/services/redisService');

let server;

async function runLoadTest() {
  await redisService.initRedis();
  const app = createApp();

  server = app.listen(0, () => {
    const port = server.address().port;
    console.log(`Server started for load testing on port ${port}`);

    const url = `http://localhost:${port}`;

    const instance = autocannon({
      url,
      connections: 100,
      duration: 10,
      requests: [
        { method: 'GET', path: '/' },
        { method: 'GET', path: '/api/quiz/generate?topic=General' },
      ],
    }, (err, result) => {
      server.close();
      redisService.closeRedis();
      
      if (err) {
        console.error('Load test failed:', err);
        process.exit(1);
      }
      
      console.log('Load Test Results:');
      console.log(autocannon.printResult(result));
      
      // Simple assertion to fail the test if 99th percentile latency is crazy high
      if (result.latency.p99 > 5000) {
        console.error('Performance assertion failed: P99 latency exceeds 5000ms');
        process.exit(1);
      }
      
      process.exit(0);
    });

    autocannon.track(instance, { renderProgressBar: true });
  });
}

runLoadTest();
