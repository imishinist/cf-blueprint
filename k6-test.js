import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { jUnit, textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';
export function handleSummary(data) {
  return {
    'tests/junit-output/k6-junit.xml': jUnit(data, { classname: 'k6-loadtest' }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}
// テストケース設定（チェック項目毎にthresholdを個別設定）
const testCases = [
  {
    name: 'home',
    url: __ENV.TARGET_URL || 'http://example.com',
    path: '/index.html',
    description: 'ホームページ - 最も重要なページ',
    thresholds: {
      'http_req_duration': 'p(95)<300',
      'http_req_failed': 'rate<0.01'
    },
    checks: [
      {
        name: 'status_check',
        description: 'status is 200',
        func: (r) => r.status === 200,
        threshold: 'rate>=0.99'
      },
      {
        name: 'response_time_check',
        description: 'response time < 300ms',
        func: (r) => r.timings.duration < 300,
        threshold: 'rate>=0.95'
      },
      // {
      //   name: 'title_check',
      //   description: 'contains title tag',
      //   func: (r) => r.body.includes('<title>'),
      //   threshold: 'rate>=0.90'
      // },
      // {
      //   name: 'navigation_check',
      //   description: 'contains navigation',
      //   func: (r) => r.body.includes('nav') || r.body.includes('menu'),
      //   threshold: 'rate>=0.85'
      // },
      // {
      //   name: 'content_length_check',
      //   description: 'content length > 1000',
      //   func: (r) => r.body.length > 1000,
      //   threshold: 'rate>=0.80'
      // }
    ]
  },
  {
    name: 'about',
    url: __ENV.TARGET_URL || 'http://example.com',
    path: '/about.html',
    description: '会社概要ページ',
    thresholds: {
      'http_req_duration': 'p(95)<500',
      'http_req_failed': 'rate<0.05'
    },
    checks: [
      {
        name: 'status_check',
        description: 'status is 200',
        func: (r) => r.status === 200,
        threshold: 'rate>=0.95'
      },
      {
        name: 'response_time_check',
        description: 'response time < 500ms',
        func: (r) => r.timings.duration < 500,
        threshold: 'rate>=0.90'
      },
      // {
      //   name: 'company_info_check',
      //   description: 'contains company info',
      //   func: (r) => r.body.includes('about') || r.body.includes('company'),
      //   threshold: 'rate>=0.85'
      // },
      // {
      //   name: 'content_length_check',
      //   description: 'content length > 500',
      //   func: (r) => r.body.length > 500,
      //   threshold: 'rate>=0.80'
      // }
    ]
  },
  {
    name: 'contact',
    url: __ENV.TARGET_URL || 'http://example.com',
    path: '/contact.html',
    description: 'お問い合わせページ',
    thresholds: {
      'http_req_duration': 'p(95)<500',
      'http_req_failed': 'rate<0.05'
    },
    checks: [
      {
        name: 'status_check',
        description: 'status is 200',
        func: (r) => r.status === 200,
        threshold: 'rate>=0.95'
      },
      {
        name: 'response_time_check',
        description: 'response time < 500ms',
        func: (r) => r.timings.duration < 500,
        threshold: 'rate>=0.90'
      },
      // {
      //   name: 'contact_form_check',
      //   description: 'contains contact form',
      //   func: (r) => r.body.includes('form') || r.body.includes('contact'),
      //   threshold: 'rate>=0.85'
      // },
      // {
      //   name: 'contact_info_check',
      //   description: 'contains email or phone',
      //   func: (r) => r.body.includes('@') || r.body.includes('tel:'),
      //   threshold: 'rate>=0.80'
      // }
    ]
  },
  {
    name: 'api',
    url: __ENV.TARGET_URL || 'http://example.com',
    path: '/api/status.json',
    description: 'APIエンドポイント',
    thresholds: {
      'http_req_duration': 'p(95)<200',
      'http_req_failed': 'rate<0.01'
    },
    checks: [
      {
        name: 'status_check',
        description: 'status is 200',
        func: (r) => r.status === 200,
        threshold: 'rate>=0.99'
      },
      {
        name: 'response_time_check',
        description: 'response time < 200ms',
        func: (r) => r.timings.duration < 200,
        threshold: 'rate>=0.95'
      },
      {
        name: 'content_type_check',
        description: 'content-type is JSON',
        func: (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
        threshold: 'rate>=0.90'
      },
      {
        name: 'json_validity_check',
        description: 'valid JSON response',
        func: (r) => {
          try {
            JSON.parse(r.body);
            return true;
          } catch (e) {
            return false;
          }
        },
        threshold: 'rate>=0.95'
      }
    ]
  }
];
// 共通のcheck関数（全てのテストケースで実行）
const commonChecks = [
  {
    name: 'server_error_check',
    description: 'no server errors (5xx)',
    func: (r) => r.status < 500,
    threshold: 'rate>=0.99'
  },
  {
    name: 'response_received_check',
    description: 'response received',
    func: (r) => r.body !== null && r.body !== undefined,
    threshold: 'rate>=0.99'
  }
];
// thresholdsオブジェクトを動的に構築
function buildThresholds(testCases, commonChecks) {
  const thresholds = {
    // 全体の基準
    'http_req_duration': ['p(95)<1000'],
  };
  // 共通チェックのthresholdを追加
  commonChecks.forEach(commonCheck => {
    const metricName = `checks{check_name:${commonCheck.name}}`;
    thresholds[metricName] = [commonCheck.threshold];
  });
  // 各テストケースのthresholdを追加
  testCases.forEach(testCase => {
    const name = testCase.name;
    // 基本メトリクス（http_req_duration, http_req_failed）
    Object.entries(testCase.thresholds).forEach(([metricName, threshold]) => {
      const taggedMetric = `${metricName}{url_name:${name}}`;
      thresholds[taggedMetric] = [threshold];
    });
    // 個別チェックのthreshold
    testCase.checks.forEach(checkItem => {
      const metricName = `checks{url_name:${name},check_name:${checkItem.name}}`;
      thresholds[metricName] = [checkItem.threshold];
    });
  });
  return thresholds;
}
export let options = {
  vus: 10,
  duration: '30s',
  thresholds: buildThresholds(testCases, commonChecks)
};
export default function() {
  // ランダムにテストケースを選択
  const testCase = testCases[Math.floor(Math.random() * testCases.length)];
  const fullUrl = testCase.url + testCase.path;

  // エンドポイント毎にグループ化
  group(`${testCase.name} - ${testCase.description}`, function() {
    // タグを付けてリクエストを実行
    let response = http.get(fullUrl, {
      tags: {
        url_name: testCase.name,
        endpoint: testCase.path,
        description: testCase.description
      }
    });

    // 共通チェック
    group('Common Checks', function() {
      commonChecks.forEach(commonCheck => {
        check(response, {
          [`${testCase.name}.Common.${commonCheck.description}`]: commonCheck.func
        }, {
          check_name: commonCheck.name
        });
      });
    });

    // 個別チェック
    group('Specific Checks', function() {
      testCase.checks.forEach(checkItem => {
        const result = check(response, {
          [`${testCase.name}.Specific.${checkItem.description}`]: checkItem.func
        }, {
          url_name: testCase.name,
          check_name: checkItem.name
        });
      });
    });
  });

  sleep(1);
}
// テスト開始時に設定を表示
export function setup() {
  console.log('=== Test Configuration ===');
  console.log('\n📋 Common Checks (applied to all URLs):');
  commonChecks.forEach(commonCheck => {
    console.log(`  - ${commonCheck.name}: ${commonCheck.description} (${commonCheck.threshold})`);
  });
  console.log('\n🎯 URL-specific Configuration:');
  testCases.forEach(testCase => {
    console.log(`\n${testCase.name}: ${testCase.description}`);
    console.log('  Basic Thresholds:');
    Object.entries(testCase.thresholds).forEach(([metric, threshold]) => {
      console.log(`    ${metric}: ${threshold}`);
    });
    console.log('  Specific Checks:');
    testCase.checks.forEach(checkItem => {
      console.log(`    - ${checkItem.name}: ${checkItem.description} (${checkItem.threshold})`);
    });
  });
  console.log('========================');
}
