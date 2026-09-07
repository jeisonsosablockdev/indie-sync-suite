/**
 * @file guardrail-interceptor.test.ts
 * @layer Domain Test
 * @description Unit tests for GuardrailInterceptor promise suspension, human approval, rejection, and TTL timeouts.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import { SqliteActionLogRepository } from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-action-log-repository';
import { GuardrailInterceptor } from '../../../apps/web/src/lib/pipelines/agent/guardrails/guardrail-interceptor';
import { ToolDefinition } from '../../../apps/web/src/lib/pipelines/agent/tools/tool-contract';
import { z } from 'zod';

describe('GuardrailInterceptor Human-in-the-Loop', () => {
  let db: DatabaseSync;
  let actionLogRepo: SqliteActionLogRepository;
  let interceptor: GuardrailInterceptor;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');
    runMigrations(db);

    actionLogRepo = new SqliteActionLogRepository(db);
    interceptor = new GuardrailInterceptor(actionLogRepo, 100); // 100ms short TTL for fast test
  });

  test('SAFE tool executes immediately without pausing or creating pending confirmation', async () => {
    const safeTool: ToolDefinition = {
      name: 'consultar_marca',
      description: 'Consultar datos de marca',
      riskLevel: 'SAFE',
      parameters: z.object({ query: z.string() }),
      execute: vi.fn().mockResolvedValue({ brandName: 'Alpha Records' }),
    };

    const result = await interceptor.executeWithGuardrails(safeTool, { query: 'test' });

    expect(result).toEqual({ brandName: 'Alpha Records' });
    expect(safeTool.execute).toHaveBeenCalled();
    expect(interceptor.getPending().length).toBe(0);

    const logs = await actionLogRepo.findAll();
    expect(logs.length).toBe(1);
    expect(logs[0]?.status).toBe('EXECUTED');
    expect(logs[0]?.riskLevel).toBe('SAFE');
  });

  test('SENSITIVE tool suspends execution until approved by human operator', async () => {
    const sensitiveTool: ToolDefinition = {
      name: 'crear_artista',
      description: 'Crear artista',
      riskLevel: 'SENSITIVE',
      parameters: z.object({ name: z.string() }),
      requiresConfirmationMessage: (p: any) => `Crear ${p.name}`,
      execute: vi.fn().mockResolvedValue({ id: 'artist-1', name: 'Sol de Noche' }),
    };

    // 1. Trigger execution (will suspend)
    const executionPromise = interceptor.executeWithGuardrails(sensitiveTool, { name: 'Sol de Noche' });

    // 2. Pending list must contain the suspended confirmation
    const pendingList = interceptor.getPending();
    expect(pendingList.length).toBe(1);
    const actionId = pendingList[0]!.id;
    expect(pendingList[0]?.toolName).toBe('crear_artista');
    expect(pendingList[0]?.params).toEqual({ name: 'Sol de Noche' });

    // Tool execute has NOT been called yet
    expect(sensitiveTool.execute).not.toHaveBeenCalled();

    // 3. Human approves action
    await interceptor.approve(actionId, 'artist-manager-jay');

    // 4. Execution promise resolves with result
    const result = await executionPromise;
    expect(result).toEqual({
      success: true,
      confirmed: true,
      result: { id: 'artist-1', name: 'Sol de Noche' },
    });

    expect(sensitiveTool.execute).toHaveBeenCalled();
    expect(interceptor.getPending().length).toBe(0);

    const logs = await actionLogRepo.findAll();
    expect(logs[0]?.status).toBe('EXECUTED');
    expect(logs[0]?.confirmedBy).toBe('artist-manager-jay');
  });

  test('SENSITIVE tool rejected by human operator resolves safely with rejection reason', async () => {
    const sensitiveTool: ToolDefinition = {
      name: 'eliminar_artista',
      description: 'Eliminar artista',
      riskLevel: 'SENSITIVE',
      parameters: z.object({ id: z.string() }),
      execute: vi.fn(),
    };

    const executionPromise = interceptor.executeWithGuardrails(sensitiveTool, { id: 'bad-artist' });

    const actionId = interceptor.getPending()[0]!.id;
    await interceptor.reject(actionId, 'No autorizo eliminar este artista');

    const result = await executionPromise;
    expect(result).toEqual({
      success: false,
      confirmed: false,
      reason: 'No autorizo eliminar este artista',
    });

    expect(sensitiveTool.execute).not.toHaveBeenCalled();

    const logs = await actionLogRepo.findAll();
    expect(logs[0]?.status).toBe('REJECTED');
  });

  test('auto-rejects when confirmation TTL expires without human input', async () => {
    const slowTool: ToolDefinition = {
      name: 'crear_artista',
      description: 'Crear artista',
      riskLevel: 'SENSITIVE',
      parameters: z.object({ name: z.string() }),
      execute: vi.fn(),
    };

    const executionPromise = interceptor.executeWithGuardrails(slowTool, { name: 'Abandoned' });

    // Wait for 120ms (TTL is set to 100ms in beforeEach)
    const result = await executionPromise;
    expect(result.success).toBe(false);
    expect(result.reason).toContain('TTL de confirmación expirado');
    expect(slowTool.execute).not.toHaveBeenCalled();
    expect(interceptor.getPending().length).toBe(0);
  });
});
