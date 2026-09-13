/**
 * Standalone Node.js Test Runner for AeroDrum 3D
 */

// Provide basic browser globals for headless Node execution
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    addEventListener: () => {},
    AudioContext: class {
      constructor() {
        this.currentTime = 0;
        this.sampleRate = 44100;
        this.state = 'running';
        this.destination = {};
      }
      createGain() {
        return {
          gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          connect: () => {}
        };
      }
      createDynamicsCompressor() {
        return {
          threshold: { setValueAtTime: () => {} },
          knee: { setValueAtTime: () => {} },
          ratio: { setValueAtTime: () => {} },
          attack: { setValueAtTime: () => {} },
          release: { setValueAtTime: () => {} },
          connect: () => {}
        };
      }
      createOscillator() {
        return {
          type: 'sine',
          frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          connect: () => {},
          start: () => {},
          stop: () => {}
        };
      }
      createBiquadFilter() {
        return {
          type: 'highpass',
          frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          Q: { setValueAtTime: () => {} },
          connect: () => {}
        };
      }
      createBufferSource() {
        return {
          buffer: null,
          connect: () => {},
          start: () => {},
          stop: () => {}
        };
      }
      createBuffer(channels, length, rate) {
        return {
          getChannelData: () => new Float32Array(length)
        };
      }
      resume() { return Promise.resolve(); }
    }
  };
}

if (typeof globalThis.performance === 'undefined') {
  globalThis.performance = { now: () => Date.now() };
}

class TestRunner {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.totalTests = 0;
    this.passed = 0;
    this.failed = 0;
  }

  suite(name, fn) {
    this.currentSuite = { name, tests: [] };
    this.suites.push(this.currentSuite);
    fn();
  }

  test(name, fn) {
    this.totalTests++;
    const testCase = { name, fn };
    this.currentSuite.tests.push(testCase);
  }

  run() {
    console.log('\n========================================');
    console.log('🥁 AERODRUM 3D - AUTOMATED TEST RUNNER');
    console.log('========================================\n');

    for (const suite of this.suites) {
      console.log(`📦 Suite: ${suite.name}`);
      for (const test of suite.tests) {
        let assertionCount = 0;
        const assert = {
          equal: (actual, expected, msg) => {
            assertionCount++;
            if (actual !== expected) {
              throw new Error(`${msg || 'Assertion failed'} - Expected: ${expected}, Got: ${actual}`);
            }
          },
          isTrue: (val, msg) => {
            assertionCount++;
            if (val !== true) {
              throw new Error(`${msg || 'Expected true'} - Got: ${val}`);
            }
          },
          isFalse: (val, msg) => {
            assertionCount++;
            if (val !== false) {
              throw new Error(`${msg || 'Expected false'} - Got: ${val}`);
            }
          },
          isNotNull: (val, msg) => {
            assertionCount++;
            if (val === null || val === undefined) {
              throw new Error(`${msg || 'Expected non-null'} - Got: ${val}`);
            }
          },
          isNull: (val, msg) => {
            assertionCount++;
            if (val !== null) {
              throw new Error(`${msg || 'Expected null'} - Got: ${val}`);
            }
          }
        };

        try {
          test.fn(assert);
          console.log(`  ✅ ${test.name} (${assertionCount} assertions)`);
          this.passed++;
        } catch (err) {
          console.error(`  ❌ ${test.name}: ${err.message}`);
          this.failed++;
        }
      }
      console.log('');
    }

    console.log('----------------------------------------');
    console.log(`Summary: ${this.passed} passed, ${this.failed} failed out of ${this.totalTests} tests.`);
    console.log('----------------------------------------\n');

    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

import { runTriggerTests } from './trigger.test.js';
import { runAudioTests } from './audio.test.js';
import { runVisionTests } from './vision.test.js';

const runner = new TestRunner();
runTriggerTests(runner);
runAudioTests(runner);
runVisionTests(runner);
runner.run();

