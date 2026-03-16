/**
 * Grammar Observability & Governance
 *
 * Tracks grammar performance, failure rates, and provides
 * governance utilities for the GBNF enforcement system.
 */

export interface GrammarMetrics {
  grammarName: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageDurationMs: number;
  lastCalled: Date;
  lastSuccess: Date;
  lastFailure: Date | null;
  failureRate: number;
}

export interface GrammarEvent {
  id: string;
  timestamp: Date;
  grammarName: string;
  eventType: "call" | "success" | "failure" | "validation_error" | "timeout";
  duration: number;
  error?: string;
  inputLength: number;
  outputLength: number;
}

export interface GovernanceConfig {
  maxFailureRate: number;
  maxAverageDuration: number;
  alertOnFailure: boolean;
  quarantineOnFailure: boolean;
  quarantineThreshold: number;
}

const DEFAULT_GOVERNANCE_CONFIG: GovernanceConfig = {
  maxFailureRate: 0.1,
  maxAverageDuration: 30000,
  alertOnFailure: true,
  quarantineOnFailure: true,
  quarantineThreshold: 0.5,
};

class GrammarMetricsCollector {
  private metrics: Map<string, GrammarMetrics> = new Map();
  private events: GrammarEvent[] = [];
  private maxEvents = 1000;
  private governanceConfig: GovernanceConfig = DEFAULT_GOVERNANCE_CONFIG;
  private quarantinedGrammars: Set<string> = new Set();

  recordCall(
    grammarName: string,
    success: boolean,
    duration: number,
    error?: string,
  ): void {
    const existing =
      this.metrics.get(grammarName) || this.createInitialMetrics(grammarName);

    existing.totalCalls++;
    if (success) {
      existing.successfulCalls++;
      existing.lastSuccess = new Date();
    } else {
      existing.failedCalls++;
      existing.lastFailure = new Date();
    }
    existing.lastCalled = new Date();

    const weights = existing.totalCalls > 1 ? 0.1 : 1.0;
    existing.averageDurationMs =
      existing.averageDurationMs * (1 - weights) + duration * weights;
    existing.failureRate = existing.failedCalls / existing.totalCalls;

    this.metrics.set(grammarName, existing);

    this.recordEvent(
      grammarName,
      success ? "success" : "failure",
      duration,
      error,
    );

    this.checkGovernance(grammarName);
  }

  recordValidation(
    grammarName: string,
    valid: boolean,
    duration: number,
    error?: string,
  ): void {
    this.recordCall(grammarName, valid, duration, error);
    this.recordEvent(
      grammarName,
      valid ? "success" : "validation_error",
      duration,
      error,
    );
  }

  private recordEvent(
    grammarName: string,
    eventType: GrammarEvent["eventType"],
    duration: number,
    error?: string,
  ): void {
    const event: GrammarEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      grammarName,
      eventType,
      duration,
      error,
      inputLength: 0,
      outputLength: 0,
    };

    this.events.push(event);

    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  private createInitialMetrics(grammarName: string): GrammarMetrics {
    return {
      grammarName,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageDurationMs: 0,
      lastCalled: new Date(),
      lastSuccess: new Date(),
      lastFailure: null,
      failureRate: 0,
    };
  }

  private checkGovernance(grammarName: string): void {
    const metrics = this.metrics.get(grammarName);
    if (!metrics) return;

    if (metrics.failureRate > this.governanceConfig.maxFailureRate) {
      console.warn(
        `[GrammarGovernance] High failure rate for ${grammarName}: ${(metrics.failureRate * 100).toFixed(1)}%`,
      );

      if (
        this.governanceConfig.quarantineOnFailure &&
        metrics.failureRate > this.governanceConfig.quarantineThreshold
      ) {
        this.quarantinedGrammars.add(grammarName);
        console.error(
          `[GrammarGovernance] Grammar ${grammarName} QUARANTINED due to high failure rate`,
        );
      }
    }

    if (metrics.averageDurationMs > this.governanceConfig.maxAverageDuration) {
      console.warn(
        `[GrammarGovernance] High average duration for ${grammarName}: ${metrics.averageDurationMs.toFixed(0)}ms`,
      );
    }
  }

  getMetrics(
    grammarName?: string,
  ): GrammarMetrics | Map<string, GrammarMetrics> {
    if (grammarName) {
      return (
        this.metrics.get(grammarName) || this.createInitialMetrics(grammarName)
      );
    }
    return this.metrics;
  }

  getEvents(grammarName?: string, limit: number = 100): GrammarEvent[] {
    let events = this.events;

    if (grammarName) {
      events = events.filter((e) => e.grammarName === grammarName);
    }

    return events.slice(-limit);
  }

  isQuarantined(grammarName: string): boolean {
    return this.quarantinedGrammars.has(grammarName);
  }

  liftQuarantine(grammarName: string): void {
    this.quarantinedGrammars.delete(grammarName);
    console.log(
      `[GrammarGovernance] Grammar ${grammarName} lifted from quarantine`,
    );
  }

  setGovernanceConfig(config: Partial<GovernanceConfig>): void {
    this.governanceConfig = { ...this.governanceConfig, ...config };
  }

  getGovernanceReport(): {
    metrics: GrammarMetrics[];
    quarantined: string[];
    config: GovernanceConfig;
  } {
    return {
      metrics: Array.from(this.metrics.values()),
      quarantined: Array.from(this.quarantinedGrammars),
      config: this.governanceConfig,
    };
  }

  reset(): void {
    this.metrics.clear();
    this.events = [];
    this.quarantinedGrammars.clear();
  }
}

export const grammarMetrics = new GrammarMetricsCollector();

export function trackGrammarCall(
  grammarName: string,
  startTime: number,
  success: boolean,
  error?: string,
): void {
  const duration = Date.now() - startTime;
  grammarMetrics.recordCall(grammarName, success, duration, error);
}

export function trackGrammarValidation(
  grammarName: string,
  startTime: number,
  valid: boolean,
  error?: string,
): void {
  const duration = Date.now() - startTime;
  grammarMetrics.recordValidation(grammarName, valid, duration, error);
}

export function getGrammarHealth(grammarName: string): {
  healthy: boolean;
  failureRate: number;
  averageDuration: number;
  quarantined: boolean;
  recommendation: string;
} {
  const metrics = grammarMetrics.getMetrics(grammarName) as GrammarMetrics;
  const quarantined = grammarMetrics.isQuarantined(grammarName);

  let healthy = !quarantined && metrics.failureRate < 0.1;
  let recommendation = "OK";

  if (quarantined) {
    healthy = false;
    recommendation =
      "Grammar is quarantined. Review errors and lift quarantine manually.";
  } else if (metrics.failureRate > 0.3) {
    recommendation = "Critical failure rate. Consider disabling grammar.";
  } else if (metrics.failureRate > 0.1) {
    recommendation = "Elevated failure rate. Monitor closely.";
  } else if (metrics.averageDurationMs > 30000) {
    recommendation = "High latency. Consider optimization.";
  }

  return {
    healthy,
    failureRate: metrics.failureRate,
    averageDuration: metrics.averageDurationMs,
    quarantined,
    recommendation,
  };
}
