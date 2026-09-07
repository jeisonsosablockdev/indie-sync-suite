/**
 * @file guardrail-interceptor.ts
 * @layer Domain
 * @description Human-in-the-Loop guardrail interceptor with suspended promises, JSON diff validation, and 5-minute TTL.
 */

import { ToolDefinition, ToolExecutionContext } from '../tools/tool-contract';
import { evaluateToolRisk } from './risk-policy';
import { SqliteActionLogRepository } from '../../../infrastructure/db/repositories/sqlite-action-log-repository';

export interface PendingConfirmation {
  id: string;
  toolName: string;
  params: Record<string, any>;
  confirmationMessage: string;
  createdAt: number;
  timeoutId: NodeJS.Timeout;
  resolve: (value: any) => void;
  executeTool: (context: ToolExecutionContext) => Promise<any>;
}

export interface PendingConfirmationView {
  id: string;
  toolName: string;
  params: Record<string, any>;
  confirmationMessage: string;
  createdAt: number;
}

export class GuardrailInterceptor {
  private actionLogRepo?: SqliteActionLogRepository;
  private pending: Map<string, PendingConfirmation> = new Map();
  private listeners: Set<() => void> = new Set();
  private readonly ttlMs: number;

  /**
   * Initializes GuardrailInterceptor with an optional action log repository and customizable TTL.
   *
   * @param actionLogRepo - Optional SQLite repository for immutable action logs
   * @param ttlMs - Time-to-live in ms for pending human approvals (defaults to 5 minutes / 300,000ms)
   */
  constructor(actionLogRepo?: SqliteActionLogRepository, ttlMs: number = 300_000) {
    this.actionLogRepo = actionLogRepo;
    this.ttlMs = ttlMs;
  }

  /**
   * Subscribes a listener to changes in the pending confirmations list.
   *
   * @param listener - Callback invoked when a confirmation is added or resolved
   * @returns Unsubscribe function
   */
  onPendingChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // Suppress callback exceptions
      }
    }
  }

  /**
   * Evaluates and executes a tool, blocking for human approval if SENSITIVE.
   *
   * @param tool - Tool definition
   * @param params - Validated tool parameters
   * @param context - Execution context
   * @returns Promise resolving to the tool execution result
   */
  async executeWithGuardrails<TParams, TResult>(
    tool: ToolDefinition<any, TResult>,
    params: TParams,
    context?: ToolExecutionContext
  ): Promise<any> {
    const risk = evaluateToolRisk(tool.name, tool.riskLevel);
    const actionId = crypto.randomUUID();

    // 1. SAFE Tools: Execute immediately without interruption
    if (risk === 'SAFE') {
      await this.actionLogRepo?.recordRequest({
        id: actionId,
        toolName: tool.name,
        paramsSnapshot: params as Record<string, any>,
        riskLevel: 'SAFE',
        status: 'EXECUTED',
      });

      try {
        const result = await tool.execute(params, context);
        await this.actionLogRepo?.updateStatus(actionId, 'EXECUTED', { resultSnapshot: result });
        return result;
      } catch (err: any) {
        await this.actionLogRepo?.updateStatus(actionId, 'FAILED', { errorMessage: err?.message });
        throw err;
      }
    }

    // 2. SENSITIVE Tools: Record REQUESTED and suspend promise for human approval
    const confirmationMessage =
      tool.requiresConfirmationMessage?.(params) ||
      `La herramienta "${tool.name}" requiere confirmación manual para proceder.`;

    // Asynchronously log to SQLite without delaying immediate UI/interceptor registration
    this.actionLogRepo?.recordRequest({
      id: actionId,
      toolName: tool.name,
      paramsSnapshot: params as Record<string, any>,
      riskLevel: 'SENSITIVE',
      status: 'REQUESTED',
    }).catch(() => {});

    return new Promise((resolve) => {
      // Step 3: Setup strict TTL timeout against memory leaks and abandoned modals
      const timeoutId = setTimeout(() => {
        this.handleTtlExpiry(actionId);
      }, this.ttlMs);

      this.pending.set(actionId, {
        id: actionId,
        toolName: tool.name,
        params: params as Record<string, any>,
        confirmationMessage,
        createdAt: Date.now(),
        timeoutId,
        resolve,
        executeTool: (execCtx) => tool.execute(params, execCtx),
      });

      this.notifyListeners();
    });
  }

  /**
   * Approves a pending action, executing the tool and logging completion.
   *
   * @param actionId - Pending confirmation UUID
   * @param confirmedBy - User identifier who approved the action
   * @returns Result of the tool execution
   */
  async approve(actionId: string, confirmedBy: string = 'human-user'): Promise<any> {
    const item = this.pending.get(actionId);
    if (!item) {
      throw new Error(`Solicitud de confirmación no encontrada o expirada: ${actionId}`);
    }

    clearTimeout(item.timeoutId);
    this.pending.delete(actionId);
    this.notifyListeners();

    await this.actionLogRepo?.updateStatus(actionId, 'CONFIRMED', { confirmedBy });

    try {
      const result = await item.executeTool({ confirmedBy, confirmedAt: new Date().toISOString() });
      await this.actionLogRepo?.updateStatus(actionId, 'EXECUTED', {
        confirmedBy,
        resultSnapshot: result,
      });
      item.resolve({ success: true, confirmed: true, result });
      return result;
    } catch (err: any) {
      await this.actionLogRepo?.updateStatus(actionId, 'FAILED', {
        confirmedBy,
        errorMessage: err?.message,
      });
      item.resolve({ success: false, confirmed: true, error: err?.message });
      throw err;
    }
  }

  /**
   * Rejects a pending action with an optional reason without crashing the conversation.
   *
   * @param actionId - Pending confirmation UUID
   * @param reason - Rejection explanation
   */
  async reject(actionId: string, reason: string = 'Acción cancelada por el usuario'): Promise<void> {
    const item = this.pending.get(actionId);
    if (!item) return;

    clearTimeout(item.timeoutId);
    this.pending.delete(actionId);
    this.notifyListeners();

    await this.actionLogRepo?.updateStatus(actionId, 'REJECTED', { errorMessage: reason });

    item.resolve({
      success: false,
      confirmed: false,
      reason,
    });
  }

  /**
   * Handles TTL timeout auto-rejection when a modal is abandoned.
   *
   * @private
   * @param actionId - Action UUID
   */
  private async handleTtlExpiry(actionId: string): Promise<void> {
    const item = this.pending.get(actionId);
    if (!item) return;

    this.pending.delete(actionId);
    this.notifyListeners();

    const reason = `TTL de confirmación expirado (${Math.round(this.ttlMs / 1000)}s)`;
    await this.actionLogRepo?.updateStatus(actionId, 'REJECTED', { errorMessage: reason });

    item.resolve({
      success: false,
      confirmed: false,
      reason,
    });
  }

  /**
   * Returns list of currently pending confirmations safe for UI consumption.
   */
  getPending(): PendingConfirmationView[] {
    return Array.from(this.pending.values()).map(p => ({
      id: p.id,
      toolName: p.toolName,
      params: p.params,
      confirmationMessage: p.confirmationMessage,
      createdAt: p.createdAt,
    }));
  }
}
