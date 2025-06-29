import http from 'k6/http';
import { check, sleep } from 'k6';
import { jUnit, textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

export function handleSummary(data) {
  return {
    'summary-junit.xml': jUnit(data, { classname: 'k6-loadtest' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}

// テストケース設定（各URLごとにthresholdとcheck基準を定義）
const testCases = [
  {
    name: 'home',
    url: __ENV.TARGET_URL || 'http://example.com',
    path: '/index.html',
    description: 'ホームページ - 最も重要なページ',
    thresholds: {
      'http_req_duration': 'p(95)<300',
      'checks': 'rate>=0.99',
      'http_req_failed': 'rate<0.01'
    },
    checks: {
      'status is 200': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
      // 'contains title tag': (r) => r.body.includes('<title>'),
      // 'contains navigation': (r) => r.body.includes('nav') || r.body.includes('menu'),
      // 'content length > 1000': (r) => r.body.length > 1000,
    }
  },
  {
    name: 'about',
    url: __ENV.TARGET_URL || 'http://example.com',
    path: '/about.html',
    description: '会社概要ページ',
    thresholds: {
      'http_req_duration': 'p(95)<500',
      'checks': 'rate>=0.95',
      'http_req_failed': 'rate<0.05'
    },
    checks: {
      'status is 200': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
      // 'contains company info': (r) => r.body.includes('about') || r.body.includes('company'),
      // 'content length > 500': (r) => r.body.length > 500,
    }
  },
  {
    name: 'contact',
    url: __ENV.TARGET_URL || 'http://example.com',
    path: '/contact.html',
    description: 'お問い合わせページ',
    thresholds: {
      'http_req_duration': 'p(95)<500',
      'checks': 'rate>=0.95',
      'http_req_failed': 'rate<0.05'
    },
    checks: {
      'status is 200': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
      // 'contains contact form': (r) => r.body.includes('form') || r.body.includes('contact'),
      // 'contains email or phone': (r) => r.body.includes('@') || r.body.includes('tel:'),
      // 'content length > 300': (r) => r.body.length > 300,
    }
  },
  {
    name: 'api',
    url: __ENV.TARGET_URL || 'http://example.com',
    path: '/api/status.json',
    description: 'APIエンドポイント - JSON レスポンス',
    thresholds: {
      'http_req_duration': 'p(95)<200',
      'checks': 'rate>=0.99',
      'http_req_failed': 'rate<0.01'
    },
    checks: {
      'status is 200': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
      'content-type is JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
      'valid JSON response': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch (e) {
          return false;
        }
      },
      'contains status field': (r) => {
        try {
          const json = JSON.parse(r.body);
          return json.hasOwnProperty('status');
        } catch (e) {
          return false;
        }
      },
    }
  }
];

// 共通のcheck関数（全てのテストケースで実行）
const commonChecks = {
  'no server errors (5xx)': (r) => r.status < 500,
  'no client errors (4xx)': (r) => r.status < 400 || r.status === 404, // 404は許容する場合
  'response received': (r) => r.body !== null && r.body !== undefined,
};

// thresholdsオブジェクトを動的に構築
function buildThresholds(testCases) {
  const thresholds = {
    // 全体の基準
    'checks': ['rate>=0.9'],
    'http_req_duration': ['p(95)<1000'],
  };

  // 各テストケースのthresholdを追加
  testCases.forEach(testCase => {
    const name = testCase.name;

    Object.entries(testCase.thresholds).forEach(([metricName, threshold]) => {
      const taggedMetric = `${metricName}{url_name:${name}}`;
      thresholds[taggedMetric] = [threshold];
    });
  });

  return thresholds;
}

export let options = {
  vus: 10,
  duration: '30s',
  thresholds: buildThresholds(testCases)
};

export default function() {
  // ランダムにテストケースを選択
  const testCase = testCases[Math.floor(Math.random() * testCases.length)];

  const fullUrl = testCase.url + testCase.path;

  console.log(`Testing ${testCase.name} (${testCase.description}): ${fullUrl}`);

  // タグを付けてリクエストを実行
  let response = http.get(fullUrl, {
    tags: {
      url_name: testCase.name,
      endpoint: testCase.path,
      description: testCase.description
    }
  });

  // 共通チェックを実行
  const commonCheckResult = check(response, commonChecks, {
    url_name: testCase.name,
    check_type: 'common'
  });

  // 個別チェックを実行（テストケース固有の検証）
  const specificCheckResult = check(response, testCase.checks, {
    url_name: testCase.name,
    check_type: 'specific'
  });

  // 結果の統合
  const allChecksPassed = commonCheckResult && specificCheckResult;

  // デバッグ情報
  if (!allChecksPassed) {
    console.error(`❌ Failed checks for ${testCase.name}:`);
    console.error(`  Status: ${response.status}, Duration: ${response.timings.duration}ms`);
    console.error(`  Common checks: ${commonCheckResult ? '✅' : '❌'}`);
    console.error(`  Specific checks: ${specificCheckResult ? '✅' : '❌'}`);
  } else {
    console.log(`✅ All checks passed for ${testCase.name}: ${response.timings.duration}ms`);
  }

  sleep(1);
}

// テスト開始時に設定を表示
export function setup() {
  console.log('=== Test Configuration ===');

  console.log('\n📋 Common Checks (applied to all URLs):');
  Object.keys(commonChecks).forEach(checkName => {
    console.log(`  - ${checkName}`);
  });

  console.log('\n🎯 URL-specific Configuration:');
  testCases.forEach(testCase => {
    console.log(`\n${testCase.name}: ${testCase.description}`);
    console.log('  Thresholds:');
    Object.entries(testCase.thresholds).forEach(([metric, threshold]) => {
      console.log(`    ${metric}: ${threshold}`);
    });
    console.log('  Specific Checks:');
    Object.keys(testCase.checks).forEach(checkName => {
      console.log(`    - ${checkName}`);
    });
  });
  console.log('========================');
}
